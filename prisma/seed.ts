import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Seeding MELAKI database...");

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "All Products", slug: "all-products" },
    }),
    prisma.category.create({
      data: { name: "Nail Polish & Lacquers", slug: "nail-polish" },
    }),
    prisma.category.create({
      data: { name: "Professional Nail Tools", slug: "nail-tools" },
    }),
    prisma.category.create({
      data: {
        name: "Manicure/Pedicure Equipment",
        slug: "manicure-pedicure",
      },
    }),
    prisma.category.create({
      data: { name: "Manicure/Cosmetics", slug: "cosmetics" },
    }),
    prisma.category.create({
      data: { name: "Beauty Accessories", slug: "accessories" },
    }),
    prisma.category.create({
      data: {
        name: "Salon Furniture & Equipment",
        slug: "salon-furniture",
      },
    }),
  ]);

  const [, , , manicurePedicure, , , salonFurniture] = categories;

  // Create 13 products matching the MELAKI design
  const products = [
    {
      name: "Nail Polish Display Stand Organizer",
      slug: "nail-polish-display-stand",
      description:
        "Professional rotating nail polish display stand. Holds up to 60 bottles with clear acrylic shelves. Perfect for salon reception areas.",
      price: 3850,
      originalPrice: 5200,
      images: [
        "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: "Sale",
      rating: 4.7,
      reviewCount: 23,
      stock: 15,
    },
    {
      name: "Rolling Manicure Cart Trolley",
      slug: "rolling-manicure-cart",
      description:
        "3-tier rolling nail technician cart with locking wheels. Ample storage for tools, polishes and supplies. Easy to move around the salon.",
      price: 6905,
      originalPrice: 8500,
      images: [
        "https://images.unsplash.com/photo-1631390836808-b37f5b59d1f6?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: "Sale",
      rating: 4.5,
      reviewCount: 17,
      stock: 8,
    },
    {
      name: "Gold Drawer Storage Cabinet",
      slug: "gold-drawer-storage-cabinet",
      description:
        "5-drawer storage cabinet with gold finish handles. Ideal for organizing nail supplies, tools and accessories in style.",
      price: 18750,
      originalPrice: null,
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: null,
      rating: 4.8,
      reviewCount: 34,
      stock: 5,
    },
    {
      name: "Comfort Nail Technician Chair",
      slug: "comfort-nail-technician-chair",
      description:
        "Ergonomic velvet nail technician chair with gold metal legs. Provides all-day comfort during nail services. Easy to clean upholstery.",
      price: 35250,
      originalPrice: 42000,
      images: [
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: "New",
      rating: 4.9,
      reviewCount: 12,
      stock: 20,
    },
    {
      name: "Adjustable Pedicure Footrest",
      slug: "adjustable-pedicure-footrest",
      description:
        "Height-adjustable pedicure footrest with anti-slip base and padded surface. Compatible with all standard pedicure bowls.",
      price: 4200,
      originalPrice: null,
      images: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80",
      ],
      categoryId: manicurePedicure.id,
      badge: null,
      rating: 4.3,
      reviewCount: 28,
      stock: 40,
    },
    {
      name: "Portable Cosmetic Train Case",
      slug: "portable-cosmetic-train-case",
      description:
        "Professional portable cosmetic train case with mirror and divided compartments. Gold-tone hardware and sturdy latches. Perfect for mobile nail technicians.",
      price: 12500,
      originalPrice: null,
      images: [
        "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: "New",
      rating: 4.6,
      reviewCount: 19,
      stock: 12,
    },
    {
      name: "Salon Stool with Gold Base",
      slug: "salon-stool-gold-base",
      description:
        "Height-adjustable hydraulic salon stool with cushioned seat and elegant gold star base. Swivels 360°. Suitable for both technicians and clients.",
      price: 18900,
      originalPrice: 23000,
      images: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: "Sale",
      rating: 4.4,
      reviewCount: 31,
      stock: 25,
    },
    {
      name: "Wall-Mounted LED Work Lamp",
      slug: "wall-mounted-led-work-lamp",
      description:
        "Flexible arm wall-mounted LED lamp with warm/cool light settings. 5x magnification option. Provides shadow-free illumination for precision nail work.",
      price: 6907,
      originalPrice: 9500,
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: null,
      rating: 4.7,
      reviewCount: 45,
      stock: 30,
    },
    {
      name: "Tall Storage Wardrobe Cabinet",
      slug: "tall-storage-wardrobe-cabinet",
      description:
        "Freestanding tall storage cabinet with adjustable shelves. Ideal for storing salon supplies, towels and equipment. White finish with gold handle.",
      price: 32500,
      originalPrice: null,
      images: [
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: null,
      rating: 4.5,
      reviewCount: 22,
      stock: 7,
    },
    {
      name: "DIY Manicure Table Desk",
      slug: "diy-manicure-table-desk",
      description:
        "Professional manicure table with built-in dust collector, LED strip light and storage drawers. Powder-coated steel frame with tempered glass top.",
      price: 42000,
      originalPrice: 55000,
      images: [
        "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: "Sale",
      rating: 4.8,
      reviewCount: 38,
      stock: 10,
    },
    {
      name: "2-Seater Client Waiting Sofa",
      slug: "client-waiting-sofa",
      description:
        "Elegant white tufted client waiting sofa with button detail and wooden legs. Accommodates two clients comfortably. Easy-clean faux leather.",
      price: 28900,
      originalPrice: null,
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: null,
      rating: 4.6,
      reviewCount: 14,
      stock: 6,
    },
    {
      name: "Full-Body Massage Chair",
      slug: "full-body-massage-chair",
      description:
        "Electric full-body massage chair with heating function. Features shiatsu massage, adjustable intensity and zero-gravity recline. Perfect for pedicure services.",
      price: 68000,
      originalPrice: 85000,
      images: [
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: null,
      rating: 4.9,
      reviewCount: 9,
      stock: 3,
    },
    {
      name: "Salon Reception Desk",
      slug: "salon-reception-desk",
      description:
        "Modern salon reception desk with built-in storage, cable management and LED accent lighting. Minimalist white design suits any salon interior.",
      price: 89000,
      originalPrice: null,
      images: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
      ],
      categoryId: salonFurniture.id,
      badge: null,
      rating: 4.7,
      reviewCount: 6,
      stock: 4,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
    console.log(`  ✅ Created: ${product.name}`);
  }

  console.log(`\n✨ Seeded ${products.length} products across ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
