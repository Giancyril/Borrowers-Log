import prisma from "../app/config/prisma";
import { utils } from "../app/utils/utils";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
  console.log("🌱 Seeding database...");

  const existing = await prisma.user.findUnique({ where: { email: "admin@nbsc.edu.ph" } });
  if (existing) {
    console.log("✅ Admin already exists — skipping");
    await prisma.$disconnect();
    return;
  }

  const hashed = await utils.hashPassword("Admin@1234");
  const admin  = await prisma.user.create({
    data: {
      username: "admin",
      email:    "admin@nbsc.edu.ph",
      password: hashed,
      name:     "SAS Admin",
      role:     "ADMIN",
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);
  console.log("   Password: Admin@1234");
  console.log("   ⚠️  Change this password after first login!");

  await prisma.$disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });