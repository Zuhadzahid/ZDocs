import { PrismaClient } from "@prisma/client";

/** Removes accounts created by the Playwright sign-up test (e2e-*@example.com). */
const prisma = new PrismaClient();
prisma.user
  .deleteMany({ where: { email: { startsWith: "e2e-", endsWith: "@example.com" } } })
  .then((r) => console.log(`Removed ${r.count} e2e account(s).`))
  .finally(() => prisma.$disconnect());
