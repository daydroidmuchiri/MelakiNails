// Standalone script to seed / reset the admin user only.
// Run with: npx tsx prisma/seed-admin.ts
import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env file."
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: "Administrator" },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Administrator",
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin user ready: ${admin.email} (role: ${admin.role})`);
}

main()
  .catch((e) => {
    console.error("❌ Admin seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
