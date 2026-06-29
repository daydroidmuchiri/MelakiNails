import { prisma } from "@/lib/prisma";
import ReviewsManager from "@/components/admin/ReviewsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews — MELAKI Admin" };

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, slug: true } },
    },
  });

  return <ReviewsManager initialReviews={JSON.parse(JSON.stringify(reviews))} />;
}
