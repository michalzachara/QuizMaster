import { database } from "@/lib/db";

export async function GET() {
  try {
    await database().$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ok", database: "connected" },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
