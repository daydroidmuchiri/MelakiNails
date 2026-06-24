import { cn } from "@/lib/utils";

interface BadgeProps {
  type: "Sale" | "New" | string;
  className?: string;
}

export function Badge({ type, className }: BadgeProps) {
  const styles: Record<string, string> = {
    Sale: "bg-badge-sale text-white",
    New: "bg-badge-new text-white",
  };

  const style = styles[type] ?? "bg-charcoal-400 text-white";

  return (
    <span
      className={cn(
        "inline-block text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
        style,
        className
      )}
    >
      {type}
    </span>
  );
}
