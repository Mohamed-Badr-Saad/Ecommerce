import "dotenv/config";

import { defineConfig } from "prisma/config";

const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error("Set DATABASE_URL (and optionally DIRECT_URL) before running Prisma commands.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
