import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "./prisma";
import { serverEnv } from "./server-env";

const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter((value): value is string => Boolean(value))
  .map((value) => `https://${value}`);

export const auth = betterAuth({
  appName: "Talié",
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: Array.from(new Set([serverEnv.NEXT_PUBLIC_APP_URL, ...vercelOrigins])),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user }) => {
      // Resend delivery is connected in the email/production chunk. Better Auth
      // still creates and validates the reset token during local development.
      if (process.env.NODE_ENV === "development") {
        console.info(`[Talié development mail] Password reset requested for ${user.email}.`);
      }
    },
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      role: { type: ["CUSTOMER", "ADMIN"], required: false, defaultValue: "CUSTOMER", input: false },
      banned: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: { database: { joins: true } },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await prisma.user.update({ where: { id: session.userId }, data: { lastLoginAt: new Date() } });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
