import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { CreateOrderPayload } from "@/types";
import { notifyOrderCreated } from "@/lib/email/senders";
import { requireAdminApi } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderPayload = await request.json();
    const { customerName, email, phone, address, items, total } = body;

    if (!customerName || !phone || !address || !items?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        email: email || null,
        phone,
        address,
        total,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
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
