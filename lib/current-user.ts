import { auth } from "@/auth";
import { database } from "@/lib/db";
import { connection } from "next/server";

export async function currentUser() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) return null;
  return database().user.findFirst({
    where: { id: session.user.id, sessionVersion: session.user.sessionVersion },
    select: { id: true, name: true, role: true },
  });
}
