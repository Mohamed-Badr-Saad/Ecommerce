import "dotenv/config";

import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.SUPER_ADMIN_NAME?.trim() || "Store administrator";
const password = process.env.SUPER_ADMIN_PASSWORD;

if (!email || !password || password.length < 12) {
  throw new Error("Set SUPER_ADMIN_EMAIL and a SUPER_ADMIN_PASSWORD of at least 12 characters.");
}

const adminEmail: string = email;
const adminPassword: string = password;

async function main() {
  let user = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!user) {
    const result = await auth.api.signUpEmail({
      body: { email: adminEmail, name, password: adminPassword, rememberMe: false },
    });
    user = await prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      adminRole: "SUPER_ADMIN",
      banned: false,
      banExpires: null,
      banReason: null,
      emailVerified: true,
      name,
      role: "ADMIN",
    },
    select: { email: true, name: true, role: true, adminRole: true },
  });

  console.info(`Super admin ready: ${updated.email} (${updated.adminRole})`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
