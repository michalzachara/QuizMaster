import { defineConfig } from "prisma/config";

// Environment is supplied by the process; do not load local secret files here.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL },
});
