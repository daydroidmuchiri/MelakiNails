import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/adminAuth";
import { slugify } from "@/lib/utils";

// GET uses request.url (via `new URL(request.url)`) and POST reads the
// admin auth token off the request (cookies/headers) — dynamic APIs.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const sort = searchParams.get("sort") ?? "featured";
    const badge = searchParams.get("badge");

    const where = {
      ...(categorySlug && categorySlug !== "all-products"
        ? { category: { slug: categorySlug } }
        : {}),
      ...(badge ? { badge } : {}),
    };

    const orderBy = (() => {
      switch (sort) {
        case "price-asc":
          return { price: "asc" as const };
        case "price-desc":
          return { price: "desc" as const };
        case "name-asc":
          return { name: "asc" as const };
        default:
          return { featured: "desc" as const };
      }
    })();

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
      },
    });

    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireAdminApi(request);
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const { name, description, price, originalPrice, sku, stock, lowStockThreshold, active, featured, categoryId, badge, images } = body;

    if (!name || !categoryId || !Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Invalid product details" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name),
        description: description ?? null,
        price,
        originalPrice: originalPrice ?? null,
        sku: sku ?? null,
        stock: Math.max(0, Math.floor(stock ?? 0)),
        lowStockThreshold: Math.max(0, Math.floor(lowStockThreshold ?? 5)),
        active: Boolean(active),
        featured: Boolean(featured),
        categoryId,
        badge: badge ?? null,
        images: Array.isArray(images) ? images : [],
      },
      include: { category: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
