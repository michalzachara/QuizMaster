import { createHash } from "node:crypto";
import { database } from "./db";

export class AppError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const digest = (text: string) => createHash("sha256").update(text).digest("hex");
export async function rateLimit(key: string, limit = 20, seconds = 60) {
  const hash = digest(key);
  const expires = new Date(Date.now() + seconds * 1000);
  const rows = await database().$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt") VALUES (${hash}, 1, ${expires})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."expiresAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" < NOW() THEN ${expires} ELSE "RateLimit"."expiresAt" END
    RETURNING "count"`;
  if (rows[0].count > limit) throw new AppError("Zbyt wiele prób. Spróbuj ponownie za chwilę.", 429);
}
export type Actor = { id: string; name: string; email: string; role: "TEACHER" | "STUDENT"; sessionVersion: number };
export function teacher(user: Actor) {
  if (user.role !== "TEACHER") throw new AppError("Ta funkcja jest dostępna dla nauczyciela.", 403);
}
export function checkOrigin(request: Request) {
  const expected = new URL(process.env.AUTH_URL || request.url).origin;
  if (request.headers.get("origin") !== expected) throw new AppError("Niedozwolone źródło żądania.", 403);
}
export async function readBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new AppError("Wymagany JSON.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("Brak danych.");
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 128_000) { await reader.cancel(); throw new AppError("Za duży formularz.", 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown; }
  catch { throw new AppError("Nieprawidłowe dane."); }
}
