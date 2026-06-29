"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X, Heart } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { SITE_CONFIG } from "@/lib/constants";
import { useState } from "react";

interface HeaderProps {
  settings?: {
    storeName: string;
  } | null;
}

export function Header({ settings }: HeaderProps) {
  const totalItems = useCartStore((state) => state.totalItems);
  const wishlistCount = useWishlistStore((state) => state.totalItems);
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount = totalItems();
  const wishlistItemCount = wishlistCount();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/products"
            className="font-display text-2xl font-bold text-charcoal tracking-tight hover:text-amber transition-colors"
          >
            {settings?.storeName || SITE_CONFIG.name}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-sm font-medium text-charcoal-400 hover:text-charcoal transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/products?category=salon-furniture"
              className="text-sm font-medium text-charcoal-400 hover:text-charcoal transition-colors"
            >
              Furniture
            </Link>
            <Link
              href="/products?category=nail-tools"
              className="text-sm font-medium text-charcoal-400 hover:text-charcoal transition-colors"
            >
              Nail Tools
            </Link>
            <Link
              href="/products?category=manicure-pedicure"
              className="text-sm font-medium text-charcoal-400 hover:text-charcoal transition-colors"
            >
              Equipment
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <Link
              href="/wishlist"
              id="wishlist-button"
              className="relative flex items-center gap-1.5 text-charcoal-400 hover:text-amber px-2 py-2 rounded-lg transition-colors duration-200"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-badge-sale text-white text-2xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistItemCount > 9 ? "9+" : wishlistItemCount}
                </span>
              )}
            </Link>
            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 bg-amber hover:bg-amber-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
              id="cart-button"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-badge-sale text-white text-2xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-charcoal-400 hover:text-charcoal"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border pb-4 pt-2">
            <nav className="flex flex-col gap-1">
              {[
                { href: "/products", label: "All Products" },
                {
                  href: "/products?category=salon-furniture",
                  label: "Salon Furniture",
                },
                {
                  href: "/products?category=nail-tools",
                  label: "Nail Tools",
                },
                {
                  href: "/products?category=manicure-pedicure",
                  label: "Manicure/Pedicure",
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium text-charcoal-400 hover:text-charcoal hover:bg-cream rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
