/**
 * @file whatsappOnboardingService.js
 * @description Service for WhatsApp-based vendor onboarding.
 * Manages conversational registration flow for new vendors via WhatsApp messages.
 * @module services/whatsappOnboardingService
 */

import Vendor from '../models/Vendor.js';
import Category from '../models/Category.js';
import { hashPhoneNumber } from '../utils/geoPrivacy.js';
import { recordConsent } from './vendorSessionService.js';

const VEHICLES = ['Pushcart', 'Cycle', 'Auto-rickshaw', 'Van'];

const sessions = new Map();

export async function handleUnregisteredContact(channel, replyTarget, phone, message) {
  try {
    const phoneHash = hashPhoneNumber(phone);

    const existingVendor = await Vendor.findOne({ PhoneHash: phoneHash });
    if (existingVendor) {
      await handleConsentReply(channel, replyTarget, phone, existingVendor, message.text);
      return;
    }

    if (message.type === 'location') {
      await channel.sendText(
        replyTarget,
        "You're not registered yet - send any message to start registration, then share your location once you're set up."
      );
      return;
    }

    if (message.type !== 'text') return;

    const text = message.text || '';
    const session = sessions.get(phone) || { state: 'IDLE' };

    switch (session.state) {
      case 'IDLE':
        sessions.set(phone, { state: 'AWAITING_NAME' });
        await channel.sendText(
          replyTarget,
          `👋 Welcome to *VendiConnect*!\n\nLet's register you as a vendor - it takes less than a minute.\n\n*What is your vendor/shop name?*\n_(e.g. Ram Fresh Vegetables)_`
        );
        break;
      case 'AWAITING_NAME':
        await handleAwaitingName(channel, replyTarget, phone, text);
        break;
      case 'AWAITING_CATEGORY':
        await handleAwaitingCategory(channel, replyTarget, phone, session, text);
        break;
      case 'AWAITING_VEHICLE':
        await handleAwaitingVehicle(channel, replyTarget, phone, session, text);
        break;
      default:
        sessions.delete(phone);
    }
  } catch (err) {
    console.error('[whatsappOnboardingService.handleUnregisteredContact]', err);
  }
}

async function handleAwaitingName(
  channel,
  replyTarget,
  phone,
  text
) {
  if (!text || text.trim().length < 2) {
    await channel.sendText(replyTarget, '⚠️ Please send your vendor/shop name (at least 2 characters).');
    return;
  }

  const categories = await Category.find({}).lean();
  if (!categories.length) {
    await channel.sendText(replyTarget, '⚠️ No categories are configured yet - please contact the admin and try again later.');
    sessions.delete(phone);
    return;
  }

  sessions.set(phone, { state: 'AWAITING_CATEGORY', name: text.trim(), categories });
  await channel.sendText(
    replyTarget,
    `Great, *${text.trim()}*! 🎉\n\nReply with a number to pick your category:\n\n${formatNumberedList(
      categories.map((c) => c.Name)
    )}`
  );
}

async function handleAwaitingCategory(
  channel,
  replyTarget,
  phone,
  session,
  text
) {
  const choice = parseInt(text, 10);
  if (!choice || choice < 1 || choice > session.categories.length) {
    await channel.sendText(
      replyTarget,
      `⚠️ Reply with a number between 1 and ${session.categories.length}:\n\n${formatNumberedList(
        session.categories.map((c) => c.Name)
      )}`
    );
    return;
  }

  const category = session.categories[choice - 1];
  sessions.set(phone, {
    ...session,
    state: 'AWAITING_VEHICLE',
    categoryId: category._id,
    categoryName: category.Name,
  });

  await channel.sendText(
    replyTarget,
    `Category set: *${category.Name}* ✅\n\nNow pick your vehicle:\n\n${formatNumberedList(VEHICLES)}`
  );
}

async function handleAwaitingVehicle(
  channel,
  replyTarget,
  phone,
  session,
  text
) {
  const choice = parseInt(text, 10);
  if (!choice || choice < 1 || choice > VEHICLES.length) {
    await channel.sendText(
      replyTarget,
      `⚠️ Reply with a number between 1 and ${VEHICLES.length}:\n\n${formatNumberedList(VEHICLES)}`
    );
    return;
  }

  const vehicle = VEHICLES[choice - 1];

  try {
    const vendor = await Vendor.create({
      VendorName: session.name.trim(),
      PhoneHash: hashPhoneNumber(phone),
      Vehicle: vehicle,
      Category_ID: session.categoryId,
      Status: 'INACTIVE',
    });

    // The Vendor doc now exists; consent is asked (and recorded) as a
    // separate step below rather than in memory, since consent is the
    // one part of this flow with real compliance weight.
    sessions.delete(phone);

    await channel.sendText(
      replyTarget,
      `🎊 Almost done, *${vendor.VendorName}*!\n\n` +
        `Before we can show your live location to nearby residents, we need your consent (per India's DPDPA):\n\n` +
        `• We store an approximate (~100m) version of your location while you're active.\n` +
        `• It auto-deletes ${process.env.LOCATION_TTL_MINUTES || 30} minutes after your last update.\n` +
        `• You can withdraw consent anytime by texting *STOP*.\n\n` +
        `Reply *YES* to agree, or *NO* to skip location sharing for now.`
    );
  } catch (err) {
    sessions.delete(phone);
    if (err.code === 11000) {
      await channel.sendText(replyTarget, '⚠️ This phone number is already registered. Contact the admin if you need to update your details.');
    } else {
      console.error('[whatsappOnboardingService.handleAwaitingVehicle]', err);
      await channel.sendText(replyTarget, '⚠️ Something went wrong on our end. Please try again in a moment.');
    }
  }
}

/**
 * Shared by both the fresh-registration path and the "Vendor exists but
 * no VendorSession yet" resume path.
 */
async function handleConsentReply(
  channel,
  replyTarget,
  phone,
  vendor,
  text
) {
  const normalized = (text || '').trim().toLowerCase();

  if (!['yes', 'no', 'y', 'n'].includes(normalized)) {
    await channel.sendText(
      replyTarget,
      `Please reply *YES* to allow live-location tracking for *${vendor.VendorName}*, or *NO* to skip it for now.`
    );
    return;
  }

  const consentGiven = normalized.startsWith('y');
  await recordConsent(vendor._id, phone, consentGiven);

  if (consentGiven) {
    await channel.sendText(
      replyTarget,
      `✅ Thanks, *${vendor.VendorName}*! You're all set.\n\n` +
        `Whenever you're out selling, send a *location pin* 📍 and nearby residents will see you on the map. Text *STOP* anytime to go offline and withdraw consent.`
    );
  } else {
    await channel.sendText(
      replyTarget,
      `No problem, *${vendor.VendorName}* - you're registered, but we won't track your location until you consent. Text *YES* anytime to turn location sharing on.`
    );
  }
}

function formatNumberedList(items) {
  return items.map((item, i) => `*${i + 1}.* ${item}`).join('\n');
}
