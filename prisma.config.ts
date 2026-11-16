import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// Migrations use a direct connection; application requests use the pooled URL.
const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

const migrationUrl = directUrl ? new URL(directUrl) : undefined;

if (migrationUrl?.hostname.endsWith(".neon.tech")) {
  migrationUrl.hostname = migrationUrl.hostname.replace("-pooler.", ".");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: migrationUrl?.toString() },
});
