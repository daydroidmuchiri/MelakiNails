import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CreateOrderPayload } from "@/types";
import { notifyOrderCreated } from "@/lib/email/senders";
import { requireAdminApi } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderPayload & {
      discountTotal?: number;
      couponCode?: string | null;
      couponId?: string | null;
    } = await request.json();

    const {
      customerName,
      email,
      phone,
      address,
      items,
      total,
      discountTotal,
      couponCode,
      couponId,
    } = body;

    if (!customerName || !phone || !address || !items?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate stock availability before proceeding
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true },
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
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}.`,
          },
          { status: 409 }
        );
      }
    }

    // Use a transaction to atomically create order and decrement stock
    const order = await prisma.$transaction(async (tx) => {
      // Re-validate coupon within transaction if provided
      let validatedCouponId: string | null = couponId || null;
      if (couponId) {
        const coupon = await tx.coupon.findUnique({
          where: { id: couponId },
          include: { _count: { select: { usages: true } } },
        });
        if (!coupon?.active) {
          validatedCouponId = null;
        } else if (
          coupon.usageLimit &&
          coupon._count.usages >= coupon.usageLimit
        ) {
          validatedCouponId = null;
        }
      }

      // Decrement stock for each item
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

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          customerName,
          email: email || null,
          phone,
          address,
          total,
          discountTotal: discountTotal ?? 0,
          couponCode: couponCode || null,
          couponId: validatedCouponId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
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
      if (validatedCouponId && discountTotal) {
        await tx.couponUsage.create({
          data: {
            couponId: validatedCouponId,
            orderId: newOrder.id,
            customerEmail: email || null,
            customerPhone: phone || null,
            discountAmount: discountTotal,
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
