import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError, type Actor } from "./security";
import { database } from "./db";

function signature(payload: string) {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is required");
  return createHmac("sha256", process.env.AUTH_SECRET).update(payload).digest("base64url");
}

export function socketTicket(user: Actor) {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, version: user.sessionVersion, exp: Date.now() + 60_000 }),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export async function ticketUser(ticket: string): Promise<Actor> {
  if (ticket.length > 2000) throw new AppError("Nieprawidłowa sesja.", 401);
  const [payload, sig] = ticket.split(".");
  const expected = signature(payload || "");
  if (
    !sig ||
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  )
    throw new AppError("Nieprawidłowa sesja.", 401);
  const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
    id: string;
    version: number;
    exp: number;
  };
  if (data.exp < Date.now()) throw new AppError("Sesja wygasła.", 401);
  const user = await database().user.findUnique({ where: { id: data.id } });
  if (!user || user.sessionVersion !== data.version) throw new AppError("Sesja wygasła.", 401);
  return user;
}
