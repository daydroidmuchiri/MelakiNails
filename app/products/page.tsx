import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";
import { SortBar } from "@/components/products/SortBar";
import type { Product, Category } from "@/types";

export const metadata: Metadata = {
  title: "Shop Professional Nail Supplies",
  description:
    "Browse our full range of salon furniture, manicure tables, pedicure chairs, nail tools and beauty equipment.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Shop Professional Nail Supplies | MELAKI",
    description:
      "Browse MELAKI salon furniture, manicure tables, pedicure chairs, nail tools and beauty equipment.",
    type: "website",
    url: "/products",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MELAKI product catalog",
      },
    ],
  },
};

interface PageProps {
  searchParams: {
    category?: string;
    sort?: string;
    badge?: string;
  };
}

async function getProducts(searchParams: PageProps["searchParams"]) {
  const { category, sort = "featured", badge } = searchParams;

  const where = {
    ...(category && category !== "all-products"
      ? { category: { slug: category } }
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

  return prisma.product.findMany({
    where,
    orderBy,
    include: { category: true },
  });
}

async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

async function getTotalProducts() {
  return prisma.product.count();
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const [products, categories, totalProducts] = await Promise.all([
    getProducts(searchParams),
    getCategories(),
    getTotalProducts(),
  ]);

  const currentCategory = searchParams.category
    ? categories.find((c) => c.slug === searchParams.category)?.name
    : undefined;

  return (
    <div className="bg-cream min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://melaki.co.ke",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Products",
                item: "https://melaki.co.ke/products",
              },
            ],
          }),
        }}
      />
      {/* Page header */}
      <div className="text-center py-8 px-4 border-b border-border bg-white">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-charcoal">
          Shop Professional Nail Supplies
        </h1>
        <p className="mt-2 text-sm text-muted max-w-xl mx-auto">
          Melaki provides high-quality professional nail supplies, salon furniture,
          and beauty equipment. Browse our curated collection below.
        </p>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted">
          <span>✓ Free delivery over KSh 5,000</span>
          <span>✓ Warranty on all furniture</span>
          <span>✓ Nairobi same-day delivery</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-56 xl:w-64 shrink-0">
            <Suspense fallback={<SidebarSkeleton />}>
              <ProductFilters
                categories={categories as unknown as Category[]}
                totalProducts={totalProducts}
              />
            </Suspense>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<SortBarSkeleton />}>
              <SortBar
                total={products.length}
                currentCategory={currentCategory}
              />
            </Suspense>
            <Suspense fallback={<GridSkeleton />}>
              <ProductGrid products={products as unknown as Product[]} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeletons ────────────────────────────────────────────────────────

function SidebarSkeleton() {
  return (
    <div className="bg-sidebar rounded-xl p-4 animate-pulse">
      <div className="h-3 bg-cream-200 rounded w-20 mb-4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 bg-cream-200 rounded mb-1" />
      ))}
    </div>
  );
}

function SortBarSkeleton() {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-border mb-5 animate-pulse">
      <div className="h-6 bg-cream-200 rounded w-48" />
      <div className="h-8 bg-cream-200 rounded w-32" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="product-card animate-pulse">
          <div className="aspect-[4/3] bg-cream-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-cream-200 rounded w-20" />
            <div className="h-4 bg-cream-200 rounded w-full" />
            <div className="h-3 bg-cream-200 rounded w-24" />
            <div className="h-4 bg-cream-200 rounded w-28" />
            <div className="h-9 bg-cream-200 rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
