# MELAKI — Professional Nail Supplies E-Commerce

A pixel-accurate, production-ready Next.js 14 e-commerce storefront for MELAKI, a Kenyan nail supplies and salon furniture shop.

#### Tech Stacks

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom MELAKI design tokens
- **Database**: PostgreSQL + Prisma ORM
- **State**: Zustand with localStorage persistence
- **Images**: Next.js `<Image>` component

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database

### 2. Clone & Install

```bash
git clone <repo-url>
cd melaki-store
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and update the database URL:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/melaki_store"
```

### 4. Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed with 13 sample products
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
melaki-store/
├── app/
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Redirect to /products
│   ├── globals.css             # Global styles + Tailwind
│   ├── products/
│   │   ├── page.tsx            # Product listing (server component)
│   │   └── [slug]/page.tsx     # Product detail
│   ├── cart/page.tsx           # Cart page (client)
│   ├── checkout/page.tsx       # Checkout + success screen
│   └── api/
│       ├── products/route.ts
│       ├── products/[id]/route.ts
│       ├── categories/route.ts
│       └── orders/route.ts
├── components/
│   ├── layout/Header.tsx
│   ├── layout/Footer.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   └── SortBar.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── StarRating.tsx
│       ├── PriceDisplay.tsx
│       └── AddToCartButton.tsx
├── store/cartStore.ts          # Zustand cart
├── lib/
│   ├── prisma.ts
│   ├── utils.ts
│   └── constants.ts
├── types/index.ts
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | List products (supports `?category=`, `?sort=`, `?badge=`) |
| GET | `/api/products/[id]` | Get single product |
| GET | `/api/categories` | List all categories with counts |
| POST | `/api/orders` | Create new order |

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add `DATABASE_URL` environment variable (use Vercel Postgres or Supabase)
4. Deploy — Vercel auto-detects Next.js
5. Run seed after first deploy: `npx prisma db seed`

## Design System

| Token | Value |
|-------|-------|
| Background | `#F7F3EE` (cream) |
| Primary accent | `#E8B84B` (amber) |
| Footer | `#1A1A2E` (charcoal) |
| Sale badge | `#E53E3E` (red) |
| New badge | `#38A169` (green) |
| Font | Inter + Playfair Display |

test test
