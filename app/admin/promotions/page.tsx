import { prisma } from "@/lib/prisma";
import { PromotionManager } from "@/components/admin/PromotionManager";

export const revalidate = 0; // Fresh reads

export default async function AdminPromotionsPage() {
  const promotions = await prisma.promotion.findMany({
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Discount & Promotions
        </h2>
        <p className="text-sm text-muted">
          Design special offers, manage campaign start/end durations, and configure percent reductions.
        </p>
      </div>

      <PromotionManager promotions={promotions} />
    </div>
  );
}
