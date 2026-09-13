/**
 * services/whatsappMessageRouter.js
 * -----------------------------------------------------------------------
 * Transport-agnostic WhatsApp message handling, shared by every inbound
 * channel (official Cloud API webhook, whatsapp-web.js dev client, and
 * any future channel). Each adapter normalizes its own message format
 * into { type, text, latitude, longitude } and provides a
 * channel.sendText(replyTarget, text) function, then calls
 * routeInboundMessage() - all registration/consent/location logic lives
 * here exactly once, regardless of which bot received the message.
 * -----------------------------------------------------------------------
 */

import Vendor from '../models/Vendor.js';
import VendorSession from '../models/VendorSession.js';
import { hashPhoneNumber } from '../utils/geoPrivacy.js';
import { ingestVendorLocation } from '../controllers/locationController.js';
import { recordConsent, withdrawConsent, hasActiveConsent } from './vendorSessionService.js';
import { handleUnregisteredContact } from './whatsappOnboardingService.js';
import { AppError } from '../utils/AppError.js';

/**
 * @param {{ sendText: (replyTarget: string, text: string) => Promise }} channel
 * @param {{ replyTarget: string, phone: string, message: { type: 'text'|'location', text?: string, latitude?: number, longitude?: number } }} input
 */
export async function routeInboundMessage(channel, { replyTarget, phone, message }) {
  if (!phone || !replyTarget || !message) return;

  const whatsAppHash = hashPhoneNumber(phone);
  const session = await VendorSession.findOne({ WhatsAppHash: whatsAppHash }).lean();

  // No session yet: either a brand-new contact, or one mid-registration/
  // mid-consent - the onboarding service owns that whole chat flow.
  if (!session) {
    await handleUnregisteredContact(channel, replyTarget, phone, message);
    return;
  }

  if (message.type === 'location') {
    const { latitude, longitude } = message;
    try {
      await ingestVendorLocation(session.Vendor_ID, latitude, longitude);
      await channel.sendText(
        replyTarget,
        `✅ Location updated! You're now visible to nearby residents for the next ${process.env.LOCATION_TTL_MINUTES || 30} minutes.\n\nText *STOP* anytime to go offline.`
      );
    } catch (err) {
      if (err instanceof AppError) {
        console.warn(`[whatsappMessageRouter] Location ping rejected for vendor ${session.Vendor_ID}: ${err.message}`);
        if (err.statusCode === 403) {
          await channel.sendText(
            replyTarget,
            "⚠️ We can't show your location yet - you haven't given consent (or withdrew it). Reply *YES* to turn location sharing back on."
          );
        }
      } else {
        throw err;
      }
    }
    return;
  }

  if (message.type !== 'text') return;

  const text = (message.text || '').trim().toLowerCase();

  if (text === 'stop' || text === 'offline') {
    await withdrawConsent(session.Vendor_ID);
    await Vendor.updateOne({ _id: session.Vendor_ID }, { $set: { Status: 'INACTIVE' } });
    await channel.sendText(
      replyTarget,
      '👋 You are now *OFFLINE* and your location-tracking consent has been withdrawn.\n\nText *YES* anytime to opt back in and go live again.'
    );
    return;
  }

  if (text === 'yes' || text === 'y') {
    const alreadyActive = await hasActiveConsent(session.Vendor_ID);
    if (alreadyActive) {
      await channel.sendText(replyTarget, "You're already opted in - send a *location pin* 📍 to go live.");
      return;
    }
    await recordConsent(session.Vendor_ID, phone, true);
    await channel.sendText(replyTarget, '✅ Consent recorded. Send a *location pin* 📍 whenever you want to go live on the map.');
    return;
  }

  const vendor = await Vendor.findById(session.Vendor_ID).select('VendorName').lean();
  await channel.sendText(
    replyTarget,
    `Hi ${vendor?.VendorName || ''}! 👋\n\nSend a *location pin* 📍 to go live, or text *STOP* to go offline.`
  );
}