import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where:  { email: "admin@nbsc.edu.ph" },
    update: {},
    create: {
      username: "admin",
      email:    "admin@nbsc.edu.ph",
      password: hashed,
      name:     "SAS Admin",
      role:     "ADMIN",
    },
  });

  console.log("✅ Admin seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());