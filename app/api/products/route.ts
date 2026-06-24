import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const body = await request.json();
    const product = await prisma.product.create({
      data: body,
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
