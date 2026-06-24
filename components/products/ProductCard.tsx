import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { AddToCartButton } from "@/components/ui/AddToCartButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="product-card group flex flex-col">
      {/* Image wrapper */}
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.images[0] ?? "/placeholder.jpg"}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUH/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMWH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqk0o1Bt2rjFfcfuFhGiAdE4J2R5HQ3oyFLhz4i9s9c8ZFKUvTNKhFa7YCgF/2Q=="
          />
        </Link>

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-2 left-2 z-10">
            <Badge type={product.badge} />
          </div>
        )}

        {/* Stock warning */}
        {product.stock <= 5 && product.stock > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-amber text-white text-2xs font-bold px-2 py-0.5 rounded-full">
              Only {product.stock} left
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        {/* Category */}
        <p className="text-2xs text-muted uppercase tracking-wider font-medium mb-1">
          {product.category.name}
        </p>

        {/* Name */}
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-semibold text-charcoal hover:text-amber transition-colors leading-snug mb-2 line-clamp-2"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <StarRating
          rating={product.rating}
          reviewCount={product.reviewCount}
          className="mb-2"
        />

        {/* Price */}
        <PriceDisplay
          price={product.price}
          originalPrice={product.originalPrice}
          size="sm"
          className="mb-3 mt-auto"
        />

        {/* CTA */}
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
