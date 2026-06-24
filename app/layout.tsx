import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "MELAKI — Professional Nail Supplies & Salon Equipment",
    template: "%s | MELAKI",
  },
  description:
    "Shop professional nail supplies, salon furniture, manicure tables, pedicure chairs, and beauty equipment in Kenya. Fast delivery, best prices.",
  keywords: [
    "nail supplies Kenya",
    "salon furniture",
    "manicure table",
    "pedicure chair",
    "nail polish",
    "beauty equipment",
    "Melaki",
  ],
  metadataBase: new URL("https://melaki.co.ke"),
  openGraph: {
    title: "MELAKI — Professional Nail Supplies & Salon Equipment",
    description: "Kenya's premier source for professional nail & salon supplies.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
