import { emailLayout, escapeHtml, headingStyle, tableStyle, tdStyle, textStyle, thStyle } from "./layout";
import { formatMoney, formatOrderNumber, type OrderEmailData } from "./order-confirmation";

export function renderAdminNewOrderEmail(order: OrderEmailData) {
  const subject = "New Order Received";
  const orderNumber = formatOrderNumber(order.orderId);
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="${tdStyle}">${escapeHtml(item.name)}</td>
        <td style="${tdStyle}text-align:center;">${item.quantity}</td>
        <td style="${tdStyle}text-align:right;">${formatMoney(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  const html = emailLayout(
    `New MELAKI order ${orderNumber} received.`,
    `<h1 style="${headingStyle}">New order received</h1>
    <p style="${textStyle}">A new storefront order has been created and is awaiting payment confirmation.</p>
    <p style="${textStyle}"><strong>Order:</strong> ${orderNumber}<br /><strong>Customer:</strong> ${escapeHtml(order.customerName)}<br /><strong>Email:</strong> ${escapeHtml(order.email || "Not provided")}<br /><strong>Phone:</strong> ${escapeHtml(order.phone)}<br /><strong>Delivery:</strong> ${escapeHtml(order.address)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="${tableStyle}">
      <thead><tr><th style="${thStyle}">Product</th><th style="${thStyle}text-align:center;">Qty</th><th style="${thStyle}text-align:right;">Value</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="${textStyle}font-size:16px;"><strong>Order value: ${formatMoney(order.total)}</strong></p>`
  );

  const text = [
    "New order received",
    `Order: ${orderNumber}`,
    `Customer: ${order.customerName}`,
    `Email: ${order.email || "Not provided"}`,
    `Phone: ${order.phone}`,
    `Delivery: ${order.address}`,
    "",
    "Products:",
    ...order.items.map(
      (item) => `- ${item.name} x ${item.quantity}: ${formatMoney(item.price * item.quantity)}`
    ),
    "",
    `Order value: ${formatMoney(order.total)}`,
  ].join("\n");

  return { subject, html, text };
}

export function renderAdminPaymentReceivedEmail(data: {
  order: OrderEmailData;
  amount: number;
  receipt?: string | null;
}) {
  const subject = "Payment Received";
  const orderNumber = formatOrderNumber(data.order.orderId);
  const html = emailLayout(
    `Payment received for MELAKI order ${orderNumber}.`,
    `<h1 style="${headingStyle}">Payment received</h1>
    <p style="${textStyle}">M-Pesa payment has been confirmed for ${orderNumber}.</p>
    <p style="${textStyle}"><strong>Customer:</strong> ${escapeHtml(data.order.customerName)}<br /><strong>Order ID:</strong> ${escapeHtml(data.order.orderId)}<br /><strong>Amount:</strong> ${formatMoney(data.amount)}<br /><strong>Receipt:</strong> ${escapeHtml(data.receipt || "N/A")}</p>`
  );

  const text = [
    "Payment received",
    `Order: ${orderNumber}`,
    `Order ID: ${data.order.orderId}`,
    `Customer: ${data.order.customerName}`,
    `Amount: ${formatMoney(data.amount)}`,
    `Receipt: ${data.receipt || "N/A"}`,
  ].join("\n");

  return { subject, html, text };
}
