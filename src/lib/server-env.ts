import "dotenv/config";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).startsWith("postgresql://"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  NEXT_PUBLIC_APP_URL: z.url(),
  RESEND_API_KEY: z.string().optional(),
});

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
});
