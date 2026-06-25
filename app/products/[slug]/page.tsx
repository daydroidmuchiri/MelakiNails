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
import { ChevronRight, Package, Truck, Shield, RefreshCw } from "lucide-react";
import type { Product } from "@/types";

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
  const image = product.images[0] ?? "/og-image.jpg";
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
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelated(product.categoryId, product.id);

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
                src={product.images[0] ?? "/placeholder.jpg"}
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
                      src={img}
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
