import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({
  rating,
  reviewCount,
  size = "sm",
  className,
}: StarRatingProps) {
  const starSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;
          return (
            <Star
              key={i}
              className={cn(
                starSize,
                filled
                  ? "fill-amber text-amber"
                  : partial
                  ? "fill-amber/50 text-amber/50"
                  : "fill-none text-charcoal-100"
              )}
            />
          );
        })}
      </div>
      {reviewCount !== undefined && (
        <span className="text-2xs text-muted">({reviewCount})</span>
      )}
    </div>
  );
}
