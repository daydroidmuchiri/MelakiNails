import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/adminAuth";

// POST /api/reviews — Submit a new product review (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, customerName, customerEmail, rating, title, comment } = body;

    if (!productId || !customerName || !rating || !title || !comment) {
      return NextResponse.json(
        { error: "Missing required fields: productId, customerName, rating, title, comment" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    // Check product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check for verified purchase (email match against orders containing this product)
    let verifiedPurchase = false;
    if (customerEmail) {
      const existingOrder = await prisma.order.findFirst({
        where: {
          email: { equals: customerEmail, mode: "insensitive" },
          status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
          items: { some: { productId } },
        },
      });
      verifiedPurchase = !!existingOrder;
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerName: customerName.trim(),
        customerEmail: customerEmail?.trim().toLowerCase() || null,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        verifiedPurchase,
        approved: false, // Requires admin moderation
      },
    });

    return NextResponse.json(
      {
        id: review.id,
        message: "Thank you! Your review has been submitted for moderation.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

// GET /api/reviews?productId=xxx — Fetch approved reviews for a product
// GET /api/reviews?all=true — Admin: fetch all reviews (requires auth)
export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId");
    const fetchAll = request.nextUrl.searchParams.get("all") === "true";

    if (fetchAll) {
      const unauthorized = await requireAdminApi(request);
      if (unauthorized) return unauthorized;

      const reviews = await prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          product: { select: { name: true, slug: true } },
        },
      });
      return NextResponse.json(reviews);
    }

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId, approved: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        rating: true,
        title: true,
        comment: true,
        verifiedPurchase: true,
        createdAt: true,
      },
    });

    // Compute aggregate stats
    const total = reviews.length;
    const average =
      total > 0
        ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
        : 0;
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    return NextResponse.json({ reviews, total, average, distribution });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

async function recalculateProductRating(productId: string) {
  const approved = await prisma.review.findMany({
    where: { productId, approved: true },
    select: { rating: true },
  });

  const total = approved.length;
  const average =
    total > 0
      ? Math.round((approved.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
      : 0;

  await prisma.product.update({
    where: { id: productId },
    data: { rating: average, reviewCount: total },
  });
}

// PATCH /api/reviews — Admin: approve or reject a review
export async function PATCH(request: NextRequest) {
  try {
    const unauthorized = await requireAdminApi(request);
    if (unauthorized) return unauthorized;

    const { id, approved } = await request.json();
    if (!id || typeof approved !== "boolean") {
      return NextResponse.json({ error: "id and approved (boolean) are required" }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { approved },
    });

    // Recalculate product rating and count after approval change
    await recalculateProductRating(review.productId);

    return NextResponse.json(review);
  } catch (error) {
    console.error("PATCH /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

// DELETE /api/reviews — Admin: delete a review
export async function DELETE(request: NextRequest) {
  try {
    const unauthorized = await requireAdminApi(request);
    if (unauthorized) return unauthorized;

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Review id is required" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id }, select: { productId: true } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });

    // Recalculate product rating after deletion
    await recalculateProductRating(review.productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
