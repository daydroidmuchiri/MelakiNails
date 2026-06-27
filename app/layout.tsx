import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";
import { Providers } from "./Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  weight: ["400", "600", "700"],
  display: "swap",
});

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
    url: "https://melaki.co.ke",
    siteName: "MELAKI",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "MELAKI professional nail supplies and salon equipment",
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "singleton" },
  });

  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <body className="min-h-screen flex flex-col bg-cream">
        <Providers>
          <Header settings={settings} />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
        </Providers>
      </body>
    </html>
  );
}
