import type { OrderStatus } from "@prisma/client";
import { emailLayout, escapeHtml, headingStyle, textStyle } from "./layout";
import { formatMoney, formatOrderNumber, type OrderEmailData } from "./order-confirmation";

const STATUS_MESSAGES: Record<string, string> = {
  PROCESSING: "Your order is being prepared by our team.",
  SHIPPED: "Your order has left MELAKI and is on the way.",
  DELIVERED: "Your order has been marked as delivered.",
  CANCELLED: "Your order has been cancelled. Contact us if you have any questions.",
};

export function renderOrderStatusUpdateEmail(
  order: OrderEmailData,
  status: OrderStatus,
  notes?: string | null
) {
  const subject = `MELAKI Order ${formatOrderNumber(order.orderId)} Update`;
  const statusLabel = status.replace(/_/g, " ");
  const message = STATUS_MESSAGES[status] || `Your order status is now ${statusLabel}.`;
  const html = emailLayout(
    `Your MELAKI order is now ${statusLabel}.`,
    `<h1 style="${headingStyle}">Order status update</h1>
    <p style="${textStyle}">Hi ${escapeHtml(order.customerName)}, your order ${formatOrderNumber(order.orderId)} is now <strong>${escapeHtml(statusLabel)}</strong>.</p>
    <p style="${textStyle}">${escapeHtml(message)}</p>
    ${notes ? `<p style="${textStyle}"><strong>Note:</strong> ${escapeHtml(notes)}</p>` : ""}
    <p style="${textStyle}"><strong>Order total:</strong> ${formatMoney(order.total)}<br /><strong>Delivery address:</strong> ${escapeHtml(order.address)}</p>`
  );

  const text = [
    "Order status update",
    `Order: ${formatOrderNumber(order.orderId)}`,
    `Status: ${statusLabel}`,
    message,
    notes ? `Note: ${notes}` : "",
    `Total: ${formatMoney(order.total)}`,
    `Delivery: ${order.address}`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}
