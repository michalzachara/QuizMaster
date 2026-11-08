import { loadEnvConfig } from "@next/env";
import { allowSocketOrigin } from "./lib/socket-origin";
loadEnvConfig(process.cwd());

async function main() {
  const [{ default: next }, { createServer }, { Server }, { database }, { ticketUser }, { gameState, gameCommand }, { AppError }] = await Promise.all([
    import("next"), import("node:http"), import("socket.io"), import("./lib/db"), import("./lib/socket-ticket"), import("./lib/game"), import("./lib/security"),
  ]);
  const dev = process.argv.includes("--dev");
  const port = Number(process.env.PORT || 3100);
  const origin = process.env.AUTH_URL || `http://localhost:${port}`;
  const app = next({ dev, port, hostname: "localhost", webpack: true });
  await app.prepare(); const handler = app.getRequestHandler();
  const http = createServer((req, res) => { void handler(req, res); });
  const io = new Server(http, { maxHttpBufferSize: 16_384, cors: { origin, credentials: true }, allowRequest: (req, done) => done(null, allowSocketOrigin(req.headers.origin, req.headers["sec-fetch-site"] as string | undefined, origin)) });
  io.use(async (socket, done) => {
    try { socket.data.user = await ticketUser(String(socket.handshake.auth.ticket || "")); socket.data.expiresAt = Date.now() + 3600000; done(); }
    catch { done(new Error("Zaloguj się ponownie.")); }
  });
  io.on("connection", socket => {
    let busy = false;
    socket.on("watch", async (id: unknown, ack) => {
      if (typeof id !== "string" || id.length > 100) return;
      try {
        const state = await gameState(socket.data.user, id);
        if (socket.data.gameId) await socket.leave(socket.data.gameId);
        socket.data.gameId = id; await socket.join(id); socket.emit("state", state);
        if (typeof ack === "function") ack({ ok: true });
      } catch { if (typeof ack === "function") ack({ error: "Brak dostępu do rozgrywki." }); }
    });
    socket.on("command", async (body: unknown, ack) => {
      if (busy || typeof ack !== "function") return;
      busy = true;
      try {
        const user = await database().user.findUnique({ where: { id: socket.data.user.id } });
        if (!user || user.sessionVersion !== socket.data.user.sessionVersion) throw new AppError("Sesja wygasła.", 401);
        await gameCommand(user, socket.data.gameId, body); ack({ ok: true });
      } catch (error) { ack({ error: error instanceof AppError ? error.message : "Nie można zapisać odpowiedzi lub odpowiedź została już zapisana." }); }
      finally { busy = false; }
    });
  });
  let polling = false;
  const timer = setInterval(async () => {
    if (polling) return; polling = true;
    try {
      await database().game.updateMany({ where: { status: "QUESTION", deadline: { lte: new Date() } }, data: { status: "RESULTS" } });
      for (const socket of io.sockets.sockets.values()) {
        if (!socket.data.gameId) continue;
        try {
          const user = await database().user.findUnique({ where: { id: socket.data.user.id } });
          if (!user || user.sessionVersion !== socket.data.user.sessionVersion || Date.now() > socket.data.expiresAt) { socket.disconnect(true); continue; }
          socket.emit("state", await gameState(user, socket.data.gameId));
        } catch { socket.emit("service-error", "Nie można odświeżyć rozgrywki. Ponawiamy połączenie."); }
      }
    } catch { console.error("Live synchronization unavailable; retrying"); }
    finally { polling = false; }
  }, 1000);
  http.listen(port, () => console.log(`QuizMaster + Socket.IO ready at ${origin}`));
  async function shutdown() { clearInterval(timer); io.close(); http.close(); await database().$disconnect(); process.exit(0); }
  process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);
}
main().catch(() => { console.error("Could not start QuizMaster"); process.exit(1); });
