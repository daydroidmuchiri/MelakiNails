import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  originalPrice?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({
  price,
  originalPrice,
  size = "md",
  className,
}: PriceDisplayProps) {
  const sizeClasses = {
    sm: { current: "text-sm font-bold", original: "text-xs", badge: "text-2xs" },
    md: { current: "text-base font-bold", original: "text-sm", badge: "text-xs" },
    lg: { current: "text-xl font-bold", original: "text-sm", badge: "text-xs" },
  };

  const classes = sizeClasses[size];
  const discount =
    originalPrice ? getDiscountPercent(price, originalPrice) : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className={cn("text-charcoal", classes.current)}>
        {formatPrice(price)}
      </span>
      {originalPrice && originalPrice > price && (
        <>
          <span className={cn("text-muted line-through", classes.original)}>
            {formatPrice(originalPrice)}
          </span>
          {discount > 0 && (
            <span
              className={cn(
                "bg-badge-sale/10 text-badge-sale font-semibold px-1.5 py-0.5 rounded",
                classes.badge
              )}
            >
              -{discount}%
            </span>
          )}
        </>
      )}
    </div>
  );
}
