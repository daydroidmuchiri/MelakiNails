import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/adminAuth";

// POST — Create a new coupon
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const {
      code,
      description,
      percentageDiscount,
      fixedDiscount,
      minimumOrder,
      usageLimit,
      perCustomerLimit,
      freeShipping,
      active,
      expiryDate,
    } = body;

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    if (!percentageDiscount && !fixedDiscount) {
      return NextResponse.json(
        { error: "Either a percentage or fixed discount must be set" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        description: description || null,
        percentageDiscount: percentageDiscount ? Number(percentageDiscount) : null,
        fixedDiscount: fixedDiscount ? Number(fixedDiscount) : null,
        minimumOrder: minimumOrder ? Number(minimumOrder) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : 1,
        freeShipping: Boolean(freeShipping),
        active: Boolean(active),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as Record<string, unknown>).code === "P2002") {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
    }
    console.error("POST /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

// PATCH — Toggle active status
export async function PATCH(request: NextRequest) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const { id, active } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Coupon id is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { active: Boolean(active) },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("PATCH /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

// DELETE — Remove a coupon
export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Coupon id is required" }, { status: 400 });
    }

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}

// GET — List all coupons
export async function GET(request: NextRequest) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { usages: true, orders: true } } },
    });
    return NextResponse.json(coupons);
  } catch (error) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}
