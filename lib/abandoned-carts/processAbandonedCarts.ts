import { prisma } from "@/lib/prisma";
import { sendEmailWithRetry } from "@/lib/email/client";
import { formatPrice } from "@/lib/utils";

const ABANDONED_HOURS = 24;
const BATCH_SIZE = 50; // batch limit per run

export interface AbandonedCartMetrics {
  scanned: number;
  remindersSent: number;
  skipped: number;
  executionTime: number;
}

/**
 * Finds carts idle for 24+ hours with an email on file and no reminder sent
 * yet, and sends a recovery reminder for each.
 *
 * The single source of truth for abandoned-cart processing — called both by
 * the opportunistic lazy path
 * (lib/abandoned-carts/maybeProcessAbandonedCarts.ts) and the optional
 * manual/scheduled API route (app/api/cron/abandoned-carts). Business logic
 * unchanged from the original cron implementation; the only addition is an
 * atomic per-cart claim (see below) so two overlapping runs can never send a
 * duplicate reminder for the same cart.
 */
export async function processAbandonedCarts(): Promise<AbandonedCartMetrics> {
  const start = Date.now();
  const cutoff = new Date(Date.now() - ABANDONED_HOURS * 60 * 60 * 1000);

  let scanned = 0;
  let remindersSent = 0;
  let skipped = 0;

  try {
    const abandonedCarts = await prisma.cartSession.findMany({
      where: {
        status: "PENDING",
        updatedAt: { lte: cutoff },
        email: { not: null },
        reminderSentAt: null,
      },
      include: { items: true },
      take: BATCH_SIZE,
    });
    scanned = abandonedCarts.length;

    const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
    const fromEmail = settings?.emailSender || process.env.STORE_FROM_EMAIL || "orders@melaki.co.ke";

    for (const cart of abandonedCarts) {
      if (!cart.email) {
        skipped++;
        continue;
      }

      // Atomically claim this cart before sending — only one concurrent run
      // (e.g. the lazy path racing the optional manual-trigger endpoint) can
      // win, preventing a duplicate reminder for the same cart.
      const claim = await prisma.cartSession.updateMany({
        where: { id: cart.id, reminderSentAt: null },
        data: { reminderSentAt: new Date() },
      });
      if (claim.count === 0) {
        skipped++;
        continue;
      }

      const cartTotal = cart.items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      );

      const itemListHtml = cart.items
        .map(
          (item) =>
            `<li style="margin-bottom:8px"><strong>${item.name}</strong> × ${item.quantity} — ${formatPrice(Number(item.price) * item.quantity)}</li>`
        )
        .join("");

      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#b87333">Did you forget something? 💅</h2>
          <p>Hi there! You left some items in your MELAKI cart. We're holding them for you!</p>
          <ul style="padding-left:20px">${itemListHtml}</ul>
          <p><strong>Cart Total: ${formatPrice(cartTotal)}</strong></p>
          <a href="${process.env.NEXTAUTH_URL || "https://melaki.co.ke"}/cart"
             style="display:inline-block;background:#b87333;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">
            Complete Your Purchase
          </a>
          <p style="margin-top:24px;color:#888;font-size:12px">
            You received this email because you added items to your cart on MELAKI.
            <a href="${process.env.NEXTAUTH_URL || "https://melaki.co.ke"}/unsubscribe">Unsubscribe</a>
          </p>
        </div>
      `;

      const text = `You left items in your MELAKI cart!\n\n${cart.items.map((i) => `${i.name} × ${i.quantity}`).join("\n")}\n\nCart Total: ${formatPrice(cartTotal)}\n\nComplete your order: ${process.env.NEXTAUTH_URL || "https://melaki.co.ke"}/cart`;

      try {
        await sendEmailWithRetry({
          to: cart.email,
          from: fromEmail,
          type: "ORDER_CONFIRMATION", // Reuse email client type for logging
          subject: "You left something behind 🛍️ — Your MELAKI cart is waiting",
          html,
          text,
        });

        await prisma.cartSession.update({
          where: { id: cart.id },
          data: { status: "SENT" },
        });

        remindersSent++;
      } catch (emailError) {
        console.error(`[abandoned-carts] Failed to send cart reminder to ${cart.email}:`, emailError);
        // Release the claim so a future run can retry sending.
        await prisma.cartSession
          .update({ where: { id: cart.id }, data: { reminderSentAt: null } })
          .catch(() => {});
        skipped++;
      }
    }
  } catch (error) {
    console.error("[abandoned-carts] Processing run failed:", error);
  }

  const executionTime = Date.now() - start;
  console.log(
    `[abandoned-carts] ${new Date().toISOString()} scanned=${scanned} remindersSent=${remindersSent} skipped=${skipped} executionTimeMs=${executionTime}`
  );

  return { scanned, remindersSent, skipped, executionTime };
}
