import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Use process.env directly with a fallback so `prisma generate` succeeds
    // in environments where DATABASE_URL isn't set at build time (e.g. Vercel CI).
    // The strict env() helper throws PrismaConfigEnvError when the variable is
    // absent, which breaks generation even though generate never connects to the DB.
    // The real runtime connection is made in lib/prisma.ts via the PrismaClient adapter.
    url: process.env.DATABASE_URL ?? "",
    // Only needed for `prisma migrate dev` / `migrate diff --from-migrations`
    // (never used by `migrate deploy`, which is what production runs).
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL || undefined,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
