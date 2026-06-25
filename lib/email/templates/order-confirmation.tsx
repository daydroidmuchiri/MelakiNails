import { emailLayout, escapeHtml, headingStyle, tableStyle, tdStyle, textStyle, thStyle } from "./layout";

export interface EmailOrderItem {
  name: string;
  sku?: string | null;
  quantity: number;
  price: number;
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  email?: string | null;
  phone: string;
  address: string;
  total: number;
  items: EmailOrderItem[];
}

export function formatOrderNumber(orderId: string) {
  return `#${orderId.slice(-8).toUpperCase()}`;
}

export function formatMoney(amount: number) {
  return `KSh ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function renderOrderConfirmationEmail(order: OrderEmailData) {
  const subject = "Your MELAKI Order Has Been Received";
  const orderNumber = formatOrderNumber(order.orderId);
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="${tdStyle}"><strong>${escapeHtml(item.name)}</strong>${
          item.sku ? `<div style="color:#6B665F;font-size:12px;">SKU: ${escapeHtml(item.sku)}</div>` : ""
        }</td>
        <td style="${tdStyle}text-align:center;">${item.quantity}</td>
        <td style="${tdStyle}text-align:right;">${formatMoney(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const html = emailLayout(
    `Your MELAKI order ${orderNumber} has been received.`,
    `<h1 style="${headingStyle}">Your order has been received</h1>
    <p style="${textStyle}">Hi ${escapeHtml(order.customerName)}, thank you for shopping with MELAKI. We have received your order and are waiting for M-Pesa payment confirmation.</p>
    <p style="${textStyle}"><strong>Order:</strong> ${orderNumber}<br /><strong>Delivery:</strong> ${escapeHtml(order.address)}<br /><strong>Phone:</strong> ${escapeHtml(order.phone)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="${tableStyle}">
      <thead><tr><th style="${thStyle}">Item</th><th style="${thStyle}text-align:center;">Qty</th><th style="${thStyle}text-align:right;">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="${textStyle}font-size:16px;"><strong>Total: ${formatMoney(order.total)}</strong></p>
    <p style="${textStyle}">Please complete the M-Pesa prompt sent during checkout. We will confirm your payment automatically once M-Pesa returns the transaction result.</p>`
  );

  const text = [
    "Your MELAKI order has been received",
    `Order: ${orderNumber}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Delivery: ${order.address}`,
    "",
    "Items:",
    ...order.items.map(
      (item) => `- ${item.name} x ${item.quantity}: ${formatMoney(item.price * item.quantity)}`
    ),
    "",
    `Total: ${formatMoney(order.total)}`,
    "Please complete the M-Pesa payment prompt sent during checkout.",
  ].join("\n");

  return { subject, html, text };
}
