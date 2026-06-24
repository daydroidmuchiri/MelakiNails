import { type ClassValue, clsx } from "clsx";

// ─── Class Name Utility ───────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── Currency Formatter ───────────────────────────────────────────────────────
export function formatPrice(price: number): string {
  return `KSh ${price.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// ─── Discount Calculator ──────────────────────────────────────────────────────
export function getDiscountPercent(
  price: number,
  originalPrice: number
): number {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

// ─── Slug Generator ───────────────────────────────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Truncate Text ────────────────────────────────────────────────────────────
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "…";
}
