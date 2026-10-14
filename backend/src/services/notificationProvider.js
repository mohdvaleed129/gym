
/**
 * Secure SMS / WhatsApp provider integration.
 * MSG91 credentials must remain in backend environment variables.
 */

const MSG91_WHATSAPP_URL =
  "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

function isSmsConfigured() {
  return Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);
}

function isWhatsappConfigured() {
  return Boolean(
    process.env.WHATSAPP_PROVIDER === "msg91" &&
    process.env.WHATSAPP_API_KEY &&
    process.env.WHATSAPP_INTEGRATED_NUMBER &&
    process.env.WHATSAPP_TEMPLATE_NAME
  );
}

function normalizeIndianMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");

  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;

  return null;
}

async function sendSms(mobile, message) {
  if (!isSmsConfigured()) {
    return {
      success: false,
      errorMessage: "SMS provider is not configured."
    };
  }

  return {
    success: false,
    errorMessage: "SMS provider integration is not implemented."
  };
}

async function sendWhatsapp(mobile, message, options = {}) {
  if (!isWhatsappConfigured()) {
    return {
      success: false,
      errorMessage: "MSG91 WhatsApp is not configured."
    };
  }

  const recipient = normalizeIndianMobile(mobile);

  if (!recipient) {
    return {
      success: false,
      errorMessage: "Invalid Indian mobile number."
    };
  }

  if (options.type !== "due") {
    return {
      success: false,
      errorMessage: "The configured WhatsApp template is only valid for due-date reminders."
    };
  }

  const memberName = String(options.memberName || "").trim();

  if (!memberName) {
    return {
      success: false,
      errorMessage: "Member name is required for the WhatsApp template."
    };
  }

  const authKey = process.env.WHATSAPP_API_KEY;

  const payload = {
    integrated_number: process.env.WHATSAPP_INTEGRATED_NUMBER,
    content_type: "template",
    payload: {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE_NAME,
        language: {
          code: "en",
          policy: "deterministic"
        },
        to_and_components: [
          {
            to: [recipient],
            components: {
              body_1: {
                type: "text",
                value: memberName
              }
            }
          }
        ]
      }
    }
  };

  try {
    const response = await fetch(MSG91_WHATSAPP_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        authkey: authKey,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      // Do not expose the API key or full provider response in errors.
      return {
        success: false,
        errorMessage: `MSG91 request failed with HTTP ${response.status}.`
      };
    }

    return {
      success: true,
      providerReference:
        result?.request_id ||
        result?.message_id ||
        result?.data?.request_id ||
        undefined
    };
  } catch (error) {
    return {
      success: false,
      errorMessage:
        error.name === "TimeoutError" || error.name === "AbortError"
          ? "MSG91 request timed out."
          : "Could not connect to MSG91."
    };
  }
}

async function send(channel, mobile, message, options = {}) {
  if (channel === "sms") return sendSms(mobile, message);
  if (channel === "whatsapp") {
    return sendWhatsapp(mobile, message, options);
  }

  return {
    success: false,
    errorMessage: "Unknown notification channel."
  };
}

module.exports = {
  send,
  isSmsConfigured,
  isWhatsappConfigured
};
