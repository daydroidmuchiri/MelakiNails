import { MpesaCredentials } from "./types";

export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // If it starts with +254 or 254 (cleaned will just be 254...)
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return cleaned;
  }

  // If it starts with 0 (e.g. 0712345678 or 0112345678)
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    return "254" + cleaned.slice(1);
  }

  // If it is 9 digits and starts with 7 or 1 (e.g. 712345678)
  if ((cleaned.startsWith("7") || cleaned.startsWith("1")) && cleaned.length === 9) {
    return "254" + cleaned;
  }

  return cleaned;
}

export function generateMpesaPassword(
  shortcode: string,
  passkey: string,
  timestamp: string
): string {
  const combined = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(combined).toString("base64");
}

export function getMpesaTimestamp(): string {
  const now = new Date();
  
  // Safaricom expects time in East Africa Time (EAT), which is UTC+3.
  // We format local date or convert UTC to EAT. For sandbox, standard local time format YYYYMMDDHHmmss is fine.
  const pad = (n: number) => n.toString().padStart(2, "0");
  
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function getMpesaCredentials(): MpesaCredentials {
  const environment = (process.env.MPESA_ENVIRONMENT as "sandbox" | "production") || "sandbox";
  const consumerKey = process.env.MPESA_CONSUMER_KEY || "";
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET || "";
  const shortcode = process.env.MPESA_SHORTCODE || "174379";
  const passkey = process.env.MPESA_PASSKEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  const callbackUrl = process.env.MPESA_CALLBACK_URL || "";

  if (!consumerKey || !consumerSecret) {
    console.warn("M-Pesa Consumer Key or Consumer Secret is missing from environment variables.");
  }

  return {
    environment,
    consumerKey,
    consumerSecret,
    shortcode,
    passkey,
    callbackUrl,
  };
}
