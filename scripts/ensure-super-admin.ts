import "dotenv/config";

import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.SUPER_ADMIN_NAME?.trim() || "Store administrator";
const password = process.env.SUPER_ADMIN_PASSWORD;
// `npm run admin:ensure -- --replace` demotes every other administrator to a customer.
const replaceOthers = process.argv.includes("--replace") || process.env.SUPER_ADMIN_REPLACE_EXISTING === "true";

if (!email || !password || password.length < 12) {
  throw new Error("Set SUPER_ADMIN_EMAIL and a SUPER_ADMIN_PASSWORD of at least 12 characters in .env.");
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
    console.info(`Created account ${adminEmail}.`);
  } else {
    // Existing account: reset its password so a forgotten admin login can be recovered.
    const context = await auth.$context;
    const credential = await context.internalAdapter.findCredentialAccount(user.id);
    if (!credential) throw new Error(`${adminEmail} has no email/password login. Use a different SUPER_ADMIN_EMAIL.`);
    await context.internalAdapter.updatePassword(user.id, await context.password.hash(adminPassword));
    await prisma.session.deleteMany({ where: { userId: user.id } });
    console.info(`Password reset for existing account ${adminEmail}.`);
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

  if (replaceOthers) {
    const others = await prisma.user.findMany({ where: { role: "ADMIN", id: { not: user.id } }, select: { id: true, email: true } });
    for (const other of others) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: other.id }, data: { role: "CUSTOMER", adminRole: null } }),
        prisma.session.deleteMany({ where: { userId: other.id } }),
      ]);
      console.info(`Removed admin access from ${other.email} (account kept as a customer, signed out).`);
    }
    if (!others.length) console.info("No other administrators found.");
  }

  console.info(`Super admin ready: ${updated.email} (${updated.adminRole})`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
