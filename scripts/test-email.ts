import "dotenv/config";
import { sendEmailWithRetry, verifyEmailProviderConfig } from "../lib/email/client";
import { renderOrderConfirmationEmail } from "../lib/email/templates/order-confirmation";
import { renderAdminNewOrderEmail } from "../lib/email/templates/admin-new-order";

const sampleOrder = {
  orderId: "test-order-email-0001",
  customerName: "Test Customer",
  email: process.env.TEST_CUSTOMER_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || "admin@melaki.co.ke",
  phone: "+254700000000",
  address: "Nairobi, Kenya",
  total: 4200,
  items: [
    {
      name: "Builder Gel",
      sku: "TEST-GEL",
      quantity: 2,
      price: 1500,
    },
    {
      name: "Nail Drill Bit Set",
      sku: "TEST-BIT",
      quantity: 1,
      price: 1200,
    },
  ],
};

async function main() {
  const mode = process.argv[2] || "verify";
  const config = verifyEmailProviderConfig();

  console.log("Email provider configuration:");
  console.log(JSON.stringify(config, null, 2));

  if (mode === "verify") {
    if (!config.hasApiKey) {
      process.exitCode = 1;
      console.error("RESEND_API_KEY is missing.");
    }
    return;
  }

  if (mode === "customer") {
    const rendered = renderOrderConfirmationEmail(sampleOrder);
    const result = await sendEmailWithRetry({
      to: sampleOrder.email,
      from: config.fromEmail,
      subject: `[Test] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
      type: "TEST_CUSTOMER",
    });
    console.log(result);
    return;
  }

  if (mode === "admin") {
    const rendered = renderAdminNewOrderEmail(sampleOrder);
    const result = await sendEmailWithRetry({
      to: config.adminEmail,
      from: config.fromEmail,
      subject: `[Test] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
      type: "TEST_ADMIN",
    });
    console.log(result);
    return;
  }

  console.error("Usage: npx tsx scripts/test-email.ts [verify|customer|admin]");
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
