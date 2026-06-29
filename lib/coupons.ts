import { prisma } from "@/lib/prisma";

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  couponId?: string;
  discount: number;
  freeShipping?: boolean;
  message?: string;
}

export async function validateCoupon(
  rawCode: string | null | undefined,
  subtotal: number,
  customerEmail?: string | null,
  customerPhone?: string | null
): Promise<CouponValidationResult> {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return { valid: true, discount: 0 };

  const coupon = await prisma.coupon.findUnique({
    where: { code },
    include: { _count: { select: { usages: true } } },
  });

  if (!coupon) return { valid: false, discount: 0, message: "Coupon not found." };
  if (!coupon.active) return { valid: false, discount: 0, message: "Coupon is disabled." };
  if (coupon.expiryDate && coupon.expiryDate < new Date()) {
    return { valid: false, discount: 0, message: "Coupon has expired." };
  }
  if (coupon.usageLimit && coupon._count.usages >= coupon.usageLimit) {
    return { valid: false, discount: 0, message: "Coupon usage limit reached." };
  }

  // Per-customer usage limit (by email or phone)
  if (coupon.perCustomerLimit && (customerEmail || customerPhone)) {
    const customerUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        OR: [
          ...(customerEmail ? [{ customerEmail: customerEmail.toLowerCase() }] : []),
          ...(customerPhone ? [{ customerPhone }] : []),
        ],
      },
    });

    if (customerUsageCount >= coupon.perCustomerLimit) {
      return {
        valid: false,
        discount: 0,
        message: `You have already used this coupon ${coupon.perCustomerLimit > 1 ? coupon.perCustomerLimit + " times" : "once"}.`,
      };
    }
  }

  const minimumOrder = coupon.minimumOrder ? Number(coupon.minimumOrder) : 0;
  if (subtotal < minimumOrder) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order is KSh ${minimumOrder.toLocaleString("en-KE")}.`,
    };
  }

  const percentageDiscount = coupon.percentageDiscount
    ? subtotal * (coupon.percentageDiscount / 100)
    : 0;
  const fixedDiscount = coupon.fixedDiscount ? Number(coupon.fixedDiscount) : 0;
  const discount = Math.min(subtotal, Math.max(percentageDiscount, fixedDiscount));

  return {
    valid: true,
    code,
    couponId: coupon.id,
    discount: Math.round(discount),
    freeShipping: coupon.freeShipping,
    message: "Coupon applied successfully!",
  };
}
