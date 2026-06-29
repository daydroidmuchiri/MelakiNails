import { prisma } from "@/lib/prisma";

export type SmsType =
  | "ORDER_RECEIVED"
  | "PAYMENT_RECEIVED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "TEST_SMS";

interface SendSmsInput {
  to: string;
  message: string;
  type: SmsType;
}

export async function sendSMS({ to, message, type }: SendSmsInput) {
  const provider = process.env.SMS_PROVIDER || "mock";
  const enabled = process.env.SMS_ENABLED === "true";

  if (!to || !message.trim()) {
    return { ok: false, error: "Missing recipient or message" };
  }

  try {
    if (!enabled || provider === "mock") {
      await prisma.smsLog.create({
        data: {
          recipient: to,
          message,
          type,
          provider: "mock",
          status: "MOCKED",
        },
      });
      return { ok: true, mocked: true };
    }

    // TODO: Add the production SMS provider adapter here when credentials are issued.
    await prisma.smsLog.create({
      data: {
        recipient: to,
        message,
        type,
        provider,
        status: "SKIPPED",
        error: "Provider adapter not configured",
      },
    });
    return { ok: false, error: "Provider adapter not configured" };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "SMS failed";
    await prisma.smsLog.create({
      data: {
        recipient: to,
        message,
        type,
        provider,
        status: "FAILED",
        error: messageText,
      },
    });
    return { ok: false, error: messageText };
  }
}

export function orderSms(type: SmsType, orderId: string, total?: number) {
  const ref = `#${orderId.slice(-8).toUpperCase()}`;
  if (type === "PAYMENT_RECEIVED") {
    return `MELAKI: Payment received for order ${ref}. Thank you.`;
  }
  if (type === "ORDER_SHIPPED") {
    return `MELAKI: Order ${ref} has shipped.`;
  }
  if (type === "ORDER_DELIVERED") {
    return `MELAKI: Order ${ref} has been delivered. Thank you.`;
  }
  return `MELAKI: Order ${ref} received${total ? ` for KSh ${total.toLocaleString("en-KE")}` : ""}.`;
}
