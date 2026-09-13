/**
 * whatsapp-client.js
 * -----------------------------------------------------------------------
 * Standalone WhatsApp Web client (whatsapp-web.js) - an alternative,
 * unofficial transport for vendor registration/location updates, for
 * development/demos where the Cloud API isn't set up yet.
 *
 * Run separately from the Express server:  node src/whatsapp-client.js
 *
 * This file is a thin adapter only - all business logic lives in
 * services/whatsappMessageRouter.js and services/whatsappOnboardingService.js,
 * shared with the official Cloud API path in controllers/webhookController.js.
 *
 * NOTE: whatsapp-web.js automates the WhatsApp Web browser session, which
 * is against WhatsApp's Terms of Service and risks the connected number
 * being banned. Local development/demos only - never production.
 * -----------------------------------------------------------------------
 */

import 'dotenv/config';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import connectDB from './config/db.js';
import ProcessedEvent from './models/ProcessedEvent.js';
import { routeInboundMessage } from './services/whatsappMessageRouter.js';

await connectDB();
console.log('[whatsapp-client] MongoDB connected');

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'vendiconnect' }),
  puppeteer: {
    executablePath:
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// This channel's reply target is a whatsapp-web.js chatId (e.g.
// "919876543210@c.us") - different addressing than the Cloud API channel,
// which is exactly why each adapter owns its own sendText().
const whatsappWebChannel = {
  sendText: (chatId, text) => client.sendMessage(chatId, text),
};

client.on('qr', (qr) => {
  console.log('\nScan this QR code with a SECOND WhatsApp account (the bot number):\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  const info = client.info;
  console.log(`[whatsapp-client] Ready as ${info?.pushname} (+${info?.wid?.user})`);
});

client.on('disconnected', (reason) => {
  console.log('[whatsapp-client] Disconnected:', reason);
});

async function isDuplicateMessage(messageId) {
  if (!messageId) {
    return false;
  }

  try {
    await ProcessedEvent.create({
      MessageId: messageId,
    });

    return false;
  } catch (err) {
    if (err.code === 11000) {
      console.log(
        `[whatsapp-client] Duplicate message ${messageId} - skipping`
      );

      return true;
    }

    throw err;
  }
}

client.on('message_create', async (msg) => {
  if (msg.fromMe) return;
  if (msg.from.includes('@g.us')) return;

  try {
    const messageId = msg.id?._serialized;

    if (await isDuplicateMessage(messageId)) {
      return;
    }

    const contact = await msg.getContact();
    const phone = contact.number || msg.from.replace('@lid', '').replace('@c.us', '');
    const replyTarget = msg.from;

    const normalized = normalizeIncomingMessage(msg);
    if (!normalized) return;

    await routeInboundMessage(whatsappWebChannel, { replyTarget, phone, message: normalized });
  } catch (err) {
    console.error('[whatsapp-client] Error handling message:', err.message || err);
  }
});

function normalizeIncomingMessage(msg) {
  if (msg.type === 'location') {
    const latitude = parseFloat(msg._data?.lat ?? msg._data?.latitude);
    const longitude = parseFloat(msg._data?.lng ?? msg._data?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { type: 'location', latitude, longitude };
  }

  if (msg.type === 'chat' || msg.type === 'text') {
    return { type: 'text', text: (msg.body || '').trim() };
  }

  return null; // media/other message types are ignored, same as before
}

console.log('[whatsapp-client] Starting...');
client.initialize();