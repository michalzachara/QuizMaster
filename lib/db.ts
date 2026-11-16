import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDatabase = globalThis as unknown as { database?: PrismaClient };

export function database() {
  if (globalDatabase.database) return globalDatabase.database;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Brak konfiguracji bazy danych.");
  const adapter = new PrismaPg({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 15_000,
  });
  globalDatabase.database = new PrismaClient({ adapter });
  return globalDatabase.database;
}
