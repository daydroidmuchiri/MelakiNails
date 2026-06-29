import { prisma } from "@/lib/prisma";
import CouponManager from "@/components/admin/CouponManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons — MELAKI Admin" };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { usages: true, orders: true } },
    },
  });

  return <CouponManager initialCoupons={JSON.parse(JSON.stringify(coupons))} />;
}
