/**
 * Provider abstraction for SMS/WhatsApp delivery. Real delivery requires
 * provider credentials in the environment. When a provider is not
 * configured, callers get an explicit "not configured" result rather than a
 * simulated success - the system must never pretend a message was sent.
 *
 * To wire up a real provider, implement its API call inside the relevant
 * branch below (e.g. call your SMS gateway's REST API using SMS_API_KEY),
 * and return { success: true, providerReference } on success or
 * { success: false, errorMessage } on failure.
 */

function isSmsConfigured() {
  return Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);
}

function isWhatsappConfigured() {
  return Boolean(process.env.WHATSAPP_PROVIDER && process.env.WHATSAPP_API_KEY);
}

async function sendSms(mobile, message) {
  if (!isSmsConfigured()) {
    return { success: false, errorMessage: "Notification service is not configured." };
  }
  // TODO: integrate real SMS provider (e.g. Twilio, MSG91) using
  // process.env.SMS_PROVIDER / SMS_API_KEY / SMS_SENDER_ID.
  try {
    throw new Error("SMS provider integration not implemented.");
  } catch (err) {
    return { success: false, errorMessage: err.message };
  }
}

async function sendWhatsapp(mobile, message) {
  if (!isWhatsappConfigured()) {
    return { success: false, errorMessage: "Notification service is not configured." };
  }
  // TODO: integrate real WhatsApp Business API using
  // process.env.WHATSAPP_PROVIDER / WHATSAPP_API_KEY / WHATSAPP_PHONE_NUMBER_ID.
  try {
    throw new Error("WhatsApp provider integration not implemented.");
  } catch (err) {
    return { success: false, errorMessage: err.message };
  }
}

async function send(channel, mobile, message) {
  if (channel === "sms") return sendSms(mobile, message);
  if (channel === "whatsapp") return sendWhatsapp(mobile, message);
  return { success: false, errorMessage: "Unknown notification channel." };
}

module.exports = { send, isSmsConfigured, isWhatsappConfigured };
