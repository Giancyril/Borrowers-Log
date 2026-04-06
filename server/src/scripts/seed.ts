import prisma from "../app/config/prisma";
import { utils } from "../app/utils/utils";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
  console.log("🌱 Seeding database...");

  const staticId = "00000000-0000-0000-0000-000000000000";
  const existing = await prisma.user.findFirst({ 
    where: { 
      OR: [
        { id: staticId },
        { email: "admin@nbsc.edu.ph" }
      ]
    } 
  });
  
  if (existing) {
    console.log("✅ Admin already exists — skipping");
    await prisma.$disconnect();
    return;
  }

  const hashed = await utils.hashPassword("Admin@1234");
  const admin  = await prisma.user.create({
    data: {
      id:       staticId,
      username: "admin",
      email:    "admin@nbsc.edu.ph",
      password: hashed,
      name:     "System Admin",
      role:     "ADMIN",
    },
  });

  console.log(`✅ Admin created: ${admin.email}`);
  console.log("   Password: Admin@1234");
  console.log("   ⚠️  Change this password after first login!");

  await prisma.$disconnect();
}

seed().catch((err) => { 
  console.error("❌ Seed failed:");
  console.error(err);
  if (err.message) console.error("Message:", err.message);
  if (err.code) console.error("Code:", err.code);
  process.exit(1); 
});