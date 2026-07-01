"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="bg-cream min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="font-display text-2xl font-bold text-charcoal mb-2">
          Something went wrong
        </h1>
        <p className="text-muted text-sm mb-6">
          We hit an unexpected error loading this page. Please try again, or head back to the shop.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-amber text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold text-charcoal hover:bg-cream-100 transition-colors"
          >
            Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}
