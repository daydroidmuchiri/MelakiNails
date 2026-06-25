import { getMpesaCredentials } from "./utils";

export async function getAccessToken(): Promise<string> {
  const credentials = getMpesaCredentials();
  const { environment, consumerKey, consumerSecret } = credentials;

  const url =
    environment === "production"
      ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `M-Pesa OAuth failed: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error("No access_token found in Safaricom OAuth response.");
    }
    
    return data.access_token;
  } catch (error) {
    console.error("Error generating M-Pesa access token:", error);
    throw error;
  }
}
