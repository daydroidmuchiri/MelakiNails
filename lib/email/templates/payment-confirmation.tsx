import { emailLayout, escapeHtml, headingStyle, textStyle } from "./layout";
import { formatMoney, formatOrderNumber, type OrderEmailData } from "./order-confirmation";

export interface PaymentEmailData {
  order: OrderEmailData;
  amount: number;
  receipt?: string | null;
  paidAt?: Date | null;
}

export function renderPaymentConfirmationEmail(data: PaymentEmailData) {
  const subject = "Payment Confirmed - MELAKI";
  const orderNumber = formatOrderNumber(data.order.orderId);
  const paidAt = data.paidAt ?? new Date();
  const paidAtText = paidAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" });

  const html = emailLayout(
    `Payment confirmed for MELAKI order ${orderNumber}.`,
    `<h1 style="${headingStyle}">Payment confirmed</h1>
    <p style="${textStyle}">Hi ${escapeHtml(data.order.customerName)}, we have received your payment for order ${orderNumber}.</p>
    <div style="background-color:#F7F3EE;border:1px solid #E8E0D7;border-radius:8px;padding:16px;margin:18px 0;">
      <p style="${textStyle}"><strong>Amount paid:</strong> ${formatMoney(data.amount)}<br /><strong>M-Pesa receipt:</strong> ${escapeHtml(data.receipt || "N/A")}<br /><strong>Payment date:</strong> ${escapeHtml(paidAtText)}</p>
    </div>
    <p style="${textStyle}">Your order is now being prepared. Our team will contact you if we need any delivery clarification.</p>`
  );

  const text = [
    "Payment confirmed",
    `Order: ${orderNumber}`,
    `Amount paid: ${formatMoney(data.amount)}`,
    `M-Pesa receipt: ${data.receipt || "N/A"}`,
    `Payment date: ${paidAtText}`,
    "Your order is now being prepared.",
  ].join("\n");

  return { subject, html, text };
}
