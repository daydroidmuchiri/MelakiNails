import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CreateOrderPayload } from "@/types";
import { notifyOrderCreated } from "@/lib/email/senders";
import { requireAdminApi } from "@/lib/adminAuth";
import { validateCoupon } from "@/lib/coupons";
import { FREE_SHIPPING_THRESHOLD, STANDARD_DELIVERY_FEE } from "@/lib/constants";
import { maybeRunExpiredOrderCleanup } from "@/lib/orders/maybeRunExpiredOrderCleanup";
import { maybeProcessAbandonedCarts } from "@/lib/abandoned-carts/maybeProcessAbandonedCarts";

// GET reads the admin auth token off the request (cookies/headers) — a
// dynamic API. Force dynamic explicitly so `next build` never attempts a
// static trial-render of this route.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderPayload & {
      couponCode?: string | null;
    } = await request.json();

    const { customerName, email, phone, address, items, couponCode } = body;

    if (!customerName || !phone || !address || !items?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Opportunistic lazy background jobs — never block or fail this request.
    try {
      await maybeRunExpiredOrderCleanup();
    } catch (error) {
      console.error("[cleanup] Failed during checkout:", error);
    }
    try {
      await maybeProcessAbandonedCarts();
    } catch (error) {
      console.error("[abandoned-carts] Failed during checkout:", error);
    }

    // Validate stock availability before proceeding, and load authoritative prices.
    // Prices/total are always recomputed server-side below — client-submitted
    // price/total values are never trusted.
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true, price: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for product ${item.productId}` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`,
          },
          { status: 409 }
        );
      }
    }

    const subtotal = items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const couponResult = await validateCoupon(couponCode, subtotal, email, phone);
    const discountTotal = couponResult.valid ? couponResult.discount : 0;
    const validatedCouponCode = couponResult.valid ? couponResult.code ?? null : null;

    // Use a transaction to atomically create order and reserve stock.
    // Stock is decremented exactly once, here, at order creation — the M-Pesa
    // callback must not decrement it again on payment success.
    const order = await prisma.$transaction(async (tx) => {
      // Re-validate coupon within the transaction to close the TOCTOU window
      // between the pre-transaction validateCoupon() call above and commit.
      let validatedCouponId: string | null = null;
      if (couponResult.valid && couponResult.couponId) {
        const coupon = await tx.coupon.findUnique({
          where: { id: couponResult.couponId },
          include: { _count: { select: { usages: true } } },
        });
        const stillValid =
          coupon?.active &&
          (!coupon.expiryDate || coupon.expiryDate >= new Date()) &&
          (!coupon.usageLimit || coupon._count.usages < coupon.usageLimit);
        if (stillValid) {
          validatedCouponId = coupon!.id;
        }
      }
      const finalDiscount = validatedCouponId ? discountTotal : 0;
      const finalFreeShipping = validatedCouponId ? Boolean(couponResult.freeShipping) : false;
      const finalDeliveryFee =
        finalFreeShipping || subtotal - finalDiscount >= FREE_SHIPPING_THRESHOLD
          ? 0
          : STANDARD_DELIVERY_FEE;
      const finalTotal = Math.max(0, subtotal - finalDiscount + finalDeliveryFee);

      // Decrement (reserve) stock for each item
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });
        if (updated.count === 0) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
      }

      // Create the order using server-computed, authoritative prices/total
      const newOrder = await tx.order.create({
        data: {
          customerName,
          email: email || null,
          phone,
          address,
          total: finalTotal,
          discountTotal: finalDiscount,
          deliveryFee: finalDeliveryFee,
          couponCode: validatedCouponId ? validatedCouponCode : null,
          couponId: validatedCouponId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: Number(productMap.get(item.productId)!.price),
            })),
          },
          statusHistory: {
            create: {
              status: "PENDING",
              notes: "Order received via storefront",
            },
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Record coupon usage if coupon was applied
      if (validatedCouponId && finalDiscount) {
        await tx.couponUsage.create({
          data: {
            couponId: validatedCouponId,
            orderId: newOrder.id,
            customerEmail: email || null,
            customerPhone: phone || null,
            discountAmount: finalDiscount,
          },
        });
      }

      return newOrder;
    });

    await notifyOrderCreated(order).catch((error) => {
      console.error("Order notification failed:", error);
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await requireAdminApi(request);
    if (unauthorized) return unauthorized;

    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
