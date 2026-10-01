import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";

import { prisma } from "./prisma";
import { sendPasswordResetEmail } from "./email";
import { serverEnv } from "./server-env";

const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter((value): value is string => Boolean(value))
  .map((value) => `https://${value}`);
const developmentOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)
  .flatMap((hostname) => [`https://${hostname}`, `http://${hostname}`]);

// `next dev` should always accept sign-ins from the local machine, even when .env points the app
// URLs at a tunnel or the Vercel domain. Production builds never add these.
const localDevelopmentOrigins = process.env.NODE_ENV === "production"
  ? []
  : ["http://localhost:3000", "http://127.0.0.1:3000", ...(process.env.PORT ? [`http://localhost:${process.env.PORT}`] : [])];

export const auth = betterAuth({
  appName: "Talié",
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  trustedOrigins: Array.from(new Set([serverEnv.NEXT_PUBLIC_APP_URL, serverEnv.BETTER_AUTH_URL, ...developmentOrigins, ...vercelOrigins, ...localDevelopmentOrigins])),
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url, token }) => {
      await sendPasswordResetEmail({ idempotencyKey: `password-reset/${token}`, name: user.name, resetUrl: url, to: user.email });
    },
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      role: { type: ["CUSTOMER", "ADMIN"], required: false, defaultValue: "CUSTOMER", input: false },
      adminRole: { type: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER", "SUPPORT"], required: false, input: false },
      banned: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    database: { joins: true },
    backgroundTasks: { handler: (promise) => after(() => promise) },
  },
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
