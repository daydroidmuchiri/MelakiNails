export const SITE_CONFIG = {
  name: "MELAKI",
  tagline: "Shop Professional Nail Supplies",
  description:
    "Melaki provides high-quality professional nail supplies, salon furniture, and beauty equipment in Kenya. Shop online and get delivered to your doorstep.",
  phone: "+254 700 000 000",
  phone2: "+254 100 100 100",
  email: "info@melaki.co.ke",
  address: "123 Salon Street, Westlands, Nairobi",
  hours: "Mon–Sat 9:00 AM – 7:00 PM",
  whatsapp: "254700000000",
  social: {
    facebook: "https://facebook.com/melaki",
    instagram: "https://instagram.com/melaki",
    twitter: "https://twitter.com/melaki",
    youtube: "https://youtube.com/melaki",
  },
};

// Flat delivery fee, waived above the free-shipping threshold or when a
// coupon grants free shipping. Computed server-side in app/api/orders/route.ts
// — this is the single source of truth; the checkout/track-order UIs must
// only ever display values the server actually charged, never re-derive them.
export const FREE_SHIPPING_THRESHOLD = 5000;
export const STANDARD_DELIVERY_FEE = 300;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
] as const;

export const BADGE_STYLES: Record<string, string> = {
  Sale: "bg-badge-sale text-white",
  New: "bg-badge-new text-white",
};
