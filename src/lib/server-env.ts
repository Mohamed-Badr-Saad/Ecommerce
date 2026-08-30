import "dotenv/config";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).startsWith("postgresql://"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  NEXT_PUBLIC_APP_URL: z.url(),
  RESEND_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_").optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(3).max(63).default("talie-catalog"),
});

const vercelDeploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
const applicationUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || vercelDeploymentUrl;
const authenticationUrl = process.env.BETTER_AUTH_URL || applicationUrl;

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: authenticationUrl,
  NEXT_PUBLIC_APP_URL: applicationUrl,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
});
