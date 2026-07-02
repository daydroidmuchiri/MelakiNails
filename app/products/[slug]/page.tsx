import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ChevronRight, Package, Truck, Shield, RefreshCw, Star, ThumbsUp } from "lucide-react";
import type { Product } from "@/types";
import ReviewForm from "./ReviewForm";
import { maybeProcessAbandonedCarts } from "@/lib/abandoned-carts/maybeProcessAbandonedCarts";

// Force dynamic — see app/products/page.tsx for rationale (this page now
// also touches the DB via the opportunistic cleanup trigger on every load).
export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product) return null;
  return {
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
  };
}

async function getRelated(categoryId: string, excludeId: string) {
  const related = await prisma.product.findMany({
    where: { categoryId, id: { not: excludeId } },
    include: { category: true },
    take: 3,
  });
  return related.map((p) => ({
    ...p,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product Not Found" };
  const image = product.images[0] || "/og-image.png";
  return {
    title: product.name,
    description:
      product.description ?? "Shop this MELAKI professional nail and salon product.",
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | MELAKI`,
      description:
        product.description ?? "Shop this MELAKI professional nail and salon product.",
      type: "website",
      url: `/products/${product.slug}`,
      images: [
        {
          url: image,
          alt: product.name,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  // Opportunistic lazy trigger — never blocks or fails this request.
  try {
    await maybeProcessAbandonedCarts();
  } catch (error) {
    console.error("[abandoned-carts] Failed during product page load:", error);
  }

  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelated(product.categoryId, product.id);

  // Fetch approved reviews
  const reviews = await prisma.review.findMany({
    where: { productId: product.id, approved: true },
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

  const guarantees = [
    { icon: Package, label: "Free Packaging" },
    { icon: Truck, label: "Nairobi Delivery" },
    { icon: Shield, label: "Quality Guarantee" },
    { icon: RefreshCw, label: "Easy Returns" },
  ];

  return (
    <div className="bg-cream min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: product.description ?? product.name,
              image: product.images,
              sku: product.sku ?? product.id,
              brand: {
                "@type": "Brand",
                name: "MELAKI",
              },
              offers: {
                "@type": "Offer",
                priceCurrency: "KES",
                price: product.price,
                availability:
                  product.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                url: `https://melaki.co.ke/products/${product.slug}`,
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Products",
                  item: "https://melaki.co.ke/products",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: product.category.name,
                  item: `https://melaki.co.ke/products?category=${product.category.slug}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: product.name,
                  item: `https://melaki.co.ke/products/${product.slug}`,
                },
              ],
            },
          ]),
        }}
      />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted">
          <Link href="/products" className="hover:text-charcoal transition-colors">
            Shop
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={`/products?category=${product.category.slug}`}
            className="hover:text-charcoal transition-colors"
          >
            {product.category.name}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-charcoal truncate max-w-48">{product.name}</span>
        </nav>
      </div>

      {/* Product detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white rounded-2xl shadow-card p-6 md:p-10">
          {/* Images */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-cream-200">
              <Image
                src={product.images[0] || "/placeholder.png"}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {product.badge && (
                <div className="absolute top-4 left-4">
                  <Badge type={product.badge} />
                </div>
              )}
            </div>
            {/* Thumbnail row if multiple images */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-amber"
                  >
                    <Image
                      src={img || "/placeholder.png"}
                      alt={`${product.name} view ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-xs text-muted uppercase tracking-widest font-medium mb-2">
              {product.category.name}
            </p>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-charcoal leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <StarRating
                rating={product.rating}
                reviewCount={product.reviewCount}
                size="md"
              />
              {product.stock > 0 ? (
                <span className="text-xs text-badge-new font-semibold">
                  ✓ In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-xs text-badge-sale font-semibold">
                  Out of Stock
                </span>
              )}
            </div>

            <div className="mt-5 pb-5 border-b border-border">
              <PriceDisplay
                price={product.price}
                originalPrice={product.originalPrice}
                size="lg"
              />
            </div>

            {product.description && (
              <p className="text-sm text-charcoal-400 leading-relaxed mt-5">
                {product.description}
              </p>
            )}

            <div className="mt-6">
              <AddToCartButton
                product={product as unknown as Product}
                className="text-base py-3"
              />
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-border">
              {guarantees.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber" />
                  </div>
                  <span className="text-xs font-medium text-charcoal-400">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-display font-bold text-charcoal">
              Customer Reviews
            </h2>
            {reviews.length > 0 && (
              <span className="text-sm text-muted">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <Star className="w-12 h-12 text-muted/30 mx-auto mb-3" />
              <p className="text-sm text-muted">No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl shadow-card p-5 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "text-amber fill-amber"
                              : "text-border"
                          }`}
                        />
                      ))}
                    </div>
                    {review.verifiedPurchase && (
                      <span className="text-2xs text-badge-new bg-badge-new/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-charcoal mb-1">{review.title}</h4>
                  <p className="text-xs text-muted leading-relaxed mb-3">{review.comment}</p>
                  <div className="mt-auto flex items-center justify-between text-3xs text-muted">
                    <span className="font-medium">{review.customerName}</span>
                    <span>{new Date(review.createdAt).toLocaleDateString("en-KE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Review Form */}
          <div className="mt-6">
            <ReviewForm productId={product.id} />
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-display font-bold text-charcoal mb-6">
              Related Products
            </h2>
            <ProductGrid products={related as unknown as Product[]} />
          </div>
        )}
      </div>
    </div>
  );
}
