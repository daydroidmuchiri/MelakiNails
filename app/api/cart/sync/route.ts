import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CartSyncItem {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  slug?: string;
  image?: string | null;
}

// POST /api/cart/sync — Upsert a CartSession for abandonment tracking
export async function POST(request: NextRequest) {
  try {
    const body: { sessionId?: string; email?: string; phone?: string; items?: CartSyncItem[] } = await request.json();
    const { sessionId, email, phone, items } = body;

    if (!sessionId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "sessionId and items are required" }, { status: 400 });
    }

    // Upsert cart session using the unique sessionId
    const session = await prisma.cartSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        email: email || null,
        phone: phone || null,
        status: "PENDING",
        lastActivityAt: new Date(),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.name || "",
            slug: item.slug || "",
            image: item.image || null,
          })),
        },
      },
      update: {
        email: email || undefined,
        phone: phone || undefined,
        status: "PENDING",
        lastActivityAt: new Date(),
        updatedAt: new Date(),
        items: {
          deleteMany: {},
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            name: item.name || "",
            slug: item.slug || "",
            image: item.image || null,
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, sessionId: session.sessionId });
  } catch (error) {
    console.error("POST /api/cart/sync error:", error);
    return NextResponse.json({ error: "Failed to sync cart" }, { status: 500 });
  }
}

// DELETE /api/cart/sync — Mark a cart session as RECOVERED (after successful checkout)
export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    await prisma.cartSession.updateMany({
      where: { sessionId },
      data: { status: "RECOVERED" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/cart/sync error:", error);
    return NextResponse.json({ error: "Failed to recover cart session" }, { status: 500 });
  }
}
