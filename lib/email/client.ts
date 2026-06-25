import { prisma } from "@/lib/prisma";

export type EmailType =
  | "ORDER_CONFIRMATION"
  | "PAYMENT_CONFIRMATION"
  | "ORDER_STATUS_UPDATE"
  | "ADMIN_NEW_ORDER"
  | "ADMIN_PAYMENT_RECEIVED"
  | "TEST_CUSTOMER"
  | "TEST_ADMIN";

export interface EmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  type: EmailType;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}

class ResendEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string | undefined) {}

  async send(message: EmailMessage) {
    if (!this.apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: message.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Resend failed with ${response.status}: ${body || response.statusText}`);
    }
  }
}

export function createEmailProvider(): EmailProvider {
  return new ResendEmailProvider(process.env.RESEND_API_KEY);
}

export function verifyEmailProviderConfig() {
  return {
    provider: "resend",
    hasApiKey: Boolean(process.env.RESEND_API_KEY),
    fromEmail: process.env.STORE_FROM_EMAIL || "orders@melaki.co.ke",
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "admin@melaki.co.ke",
  };
}

const RETRY_DELAYS_MS = [250, 750];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmailWithRetry(
  message: EmailMessage,
  provider: EmailProvider = createEmailProvider()
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await provider.send(message);
      await prisma.emailLog.create({
        data: {
          recipient: message.to,
          subject: message.subject,
          type: message.type,
          status: "SENT",
        },
      });
      return { ok: true, attempts: attempt };
    } catch (error) {
      lastError = error;
      console.error(`Email send failed (${message.type}) attempt ${attempt}:`, error);
      if (attempt < 3) {
        await wait(RETRY_DELAYS_MS[attempt - 1]);
      }
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : "Unknown email failure";
  await prisma.emailLog.create({
    data: {
      recipient: message.to,
      subject: message.subject,
      type: message.type,
      status: "FAILED",
      error: errorMessage,
    },
  });

  return { ok: false, attempts: 3, error: errorMessage };
}
