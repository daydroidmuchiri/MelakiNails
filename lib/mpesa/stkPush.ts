import { getAccessToken } from "./auth";
import { StkPushResponsePayload, StkPushRequestPayload } from "./types";
import {
  formatPhoneNumber,
  getMpesaTimestamp,
  generateMpesaPassword,
  getMpesaCredentials,
} from "./utils";

interface StkPushParams {
  amount: number;
  phone: string;
  orderId: string;
}

export async function initiateStkPush({
  amount,
  phone,
  orderId,
}: StkPushParams): Promise<StkPushResponsePayload> {
  const credentials = getMpesaCredentials();
  const { environment, shortcode, passkey, callbackUrl } = credentials;

  const accessToken = await getAccessToken();
  const timestamp = getMpesaTimestamp();
  const password = generateMpesaPassword(shortcode, passkey, timestamp);
  const formattedPhone = formatPhoneNumber(phone);

  const url =
    environment === "production"
      ? "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
      : "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

  // Safaricom expects the amount to be an integer (as a rounded string)
  const roundedAmount = Math.round(amount).toString();

  const payload: StkPushRequestPayload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: roundedAmount,
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: `Order ${orderId.slice(-8).toUpperCase()}`,
    TransactionDesc: `MELAKI Order Payment`,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `M-Pesa STK Push API failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data: StkPushResponsePayload = await response.json();
    return data;
  } catch (error) {
    console.error("Error initiating M-Pesa STK Push:", error);
    throw error;
  }
}
