import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal, email, phone } = await request.json();

    if (!code || subtotal === undefined) {
      return NextResponse.json(
        { error: "Coupon code and subtotal are required" },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, Number(subtotal), email, phone);

    if (!result.valid) {
      return NextResponse.json({ valid: false, message: result.message }, { status: 422 });
    }

    // Fetch extra coupon metadata to return for UI display
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
      select: {
        freeShipping: true,
        percentageDiscount: true,
        fixedDiscount: true,
        minimumOrder: true,
        description: true,
      },
    });

    return NextResponse.json({
      valid: true,
      couponId: result.couponId,
      code: result.code,
      discount: result.discount,
      freeShipping: coupon?.freeShipping ?? false,
      description: coupon?.description ?? null,
      message: result.message,
    });
  } catch (error) {
    console.error("Coupon validate error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
