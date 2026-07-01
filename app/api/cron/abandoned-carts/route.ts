import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailWithRetry } from "@/lib/email/client";
import { formatPrice } from "@/lib/utils";
import { isValidCronRequest } from "@/lib/cronAuth";

// GET /api/cron/abandoned-carts — Call via Vercel Cron or external scheduler
// Finds ACTIVE carts idle for 24+ hours where we have an email, sends reminder
export async function GET(request: NextRequest) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const abandonedCarts = await prisma.cartSession.findMany({
      where: {
        status: "PENDING",
        updatedAt: { lte: cutoff },
        email: { not: null },
        reminderSentAt: null,
      },
      include: {
        items: true,
      },
      take: 50, // Batch limit per cron run
    });

    let sent = 0;
    let failed = 0;

    const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
    const fromEmail = settings?.emailSender || process.env.STORE_FROM_EMAIL || "orders@melaki.co.ke";

    for (const cart of abandonedCarts) {
      if (!cart.email) continue;

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
          data: { reminderSentAt: new Date(), status: "SENT" },
        });

        sent++;
      } catch (emailError) {
        console.error(`Failed to send cart reminder to ${cart.email}:`, emailError);
        failed++;
      }
    }

    return NextResponse.json({
      processed: abandonedCarts.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("Abandoned cart cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
