import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";
loadEnvConfig(process.cwd());
const base = process.env.AUTH_URL || "http://localhost:3100";
const run = `qa-${randomUUID()}`;
const password = `Test-${randomUUID()}`;
async function main() {
  const { database } = await import("../lib/db"); const db = database();
  const users: string[] = []; const quizzes: string[] = []; const sockets: Socket[] = [];
  function client() {
    const jar = new Map<string, string>();
    return async (path: string, method = "GET", body?: unknown) => {
      const form = body instanceof URLSearchParams;
      const response = await fetch(`${base}${path}`, { method, headers: { Origin: base, Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), ...(body ? { "Content-Type": form ? "application/x-www-form-urlencoded" : "application/json" } : {}) }, body: body ? form ? body.toString() : JSON.stringify(body) : undefined, redirect: "manual" });
      for (const c of response.headers.getSetCookie()) { const [pair] = c.split(";"); const idx = pair.indexOf("="); jar.set(pair.slice(0, idx), pair.slice(idx + 1)); }
      const text = await response.text();
      let data; try { data = JSON.parse(text); } catch { data = { html: text }; }
      return { status: response.status, data, location: response.headers.get("location") };
    };
  }
  const teacher = client(), student = client(), other = client();
  async function login(request: ReturnType<typeof client>, email: string) {
    const csrf = await request("/api/auth/csrf");
    const response = await request("/api/auth/callback/credentials", "POST", new URLSearchParams({ csrfToken: csrf.data.csrfToken, email, password, callbackUrl: `${base}/dashboard` }));
    assert.ok([200, 302].includes(response.status));
    const me = await request("/api/v1/me"); assert.equal(me.status, 200, JSON.stringify(me.data));
  }
  try {
    for (const [label, role] of [["teacher", "TEACHER"], ["student", "STUDENT"], ["other", "STUDENT"]] as const) {
      const email = `${run}-${label}@example.invalid`;
      const response = await teacher("/api/v1/register", "POST", { email, name: `QA ${label}`, password, role });
      assert.equal(response.status, 200, JSON.stringify(response.data));
      const user = await db.user.findUniqueOrThrow({ where: { email } }); users.push(user.id);
      assert.equal(user.role, role);
    }
    console.log("PASS: registration selects STUDENT or TEACHER without invitation or email code");
    await login(teacher, `${run}-teacher@example.invalid`); await login(student, `${run}-student@example.invalid`); await login(other, `${run}-other@example.invalid`);
    console.log("PASS: Auth.js sign-in and server-side session validation");
    for (const path of ["/", "/login", "/register"]) {
      const page = await teacher(path);
      assert.ok(page.location === "/dashboard" || /NEXT_REDIRECT.*dashboard|url=\/dashboard/.test(page.data.html || ""), `Expected dashboard redirect at ${path}`);
      assert.equal((page.data.html || "").includes("Nauka, która"), false);
    }
    console.log("PASS: authenticated home, login and registration redirect to dashboard without rendering landing");
    const input = { title: "QA — quiz integracyjny", description: "Temporary integration fixture", published: true, questions: [{ text: "Ile to 2 + 2?", type: "SINGLE", seconds: 5, points: 1000, options: [{ text: "4", correct: true }, { text: "5", correct: false }] }] };
    const forbidden = await student("/api/v1/quizzes", "POST", input); assert.equal(forbidden.status, 403); assert.equal(await db.quiz.count({ where: { ownerId: users[1] } }), 0);
    console.log("PASS SECURITY: student cannot create teacher quiz; database unchanged");
    const created = await teacher("/api/v1/quizzes", "POST", input); assert.equal(created.status, 200, JSON.stringify(created.data)); const quizId = created.data.id; quizzes.push(quizId);
    const denied = await student(`/api/v1/quizzes/${quizId}`); assert.equal(denied.status, 403);
    const edited = await teacher(`/api/v1/quizzes/${quizId}`, "PUT", { ...input, description: "Edited" }); assert.equal(edited.status, 200);
    const q = await db.question.findFirstOrThrow({ where: { quizId }, include: { options: true } }); const correct = q.options.find(o => o.correct)!.id;
    const assigned = await teacher(`/api/v1/quizzes/${quizId}/assignments`, "POST", { maxAttempts: 1, opensAt: new Date().toISOString(), closesAt: new Date(Date.now() + 60000).toISOString(), revealAnswers: true }); assert.equal(assigned.status, 200);
    const begun = await student(`/api/v1/assignments/${assigned.data.id}`, "POST", {}); assert.equal(begun.status, 200); const attemptId = begun.data.id;
    const savedAssignment = await db.assignment.findUniqueOrThrow({ where: { id: assigned.data.id } });
    assert.equal(savedAssignment.timeLimitSeconds, 305);
    const startedAttempt = await db.attempt.findUniqueOrThrow({ where: { id: attemptId } });
    assert.ok(startedAttempt.deadline > savedAssignment.closesAt!);
    await db.assignment.update({ where: { id: assigned.data.id }, data: { closesAt: new Date(Date.now() - 1) } });
    assert.equal((await other(`/api/v1/assignments/${assigned.data.id}`, "POST", {})).status, 403);
    assert.equal((await student(`/api/v1/assignments/${assigned.data.id}`, "POST", {})).data.id, attemptId);
    console.log("PASS: duration = sum of question limits + 5 minutes; expired link blocks new starts but permits resuming");
    const state = await student(`/api/v1/attempts/${attemptId}`); assert.equal(JSON.stringify(state.data).includes("correct"), false);
    const before = await db.attempt.findUniqueOrThrow({ where: { id: attemptId } });
    assert.equal((await other(`/api/v1/attempts/${attemptId}`)).status, 403);
    assert.equal((await other(`/api/v1/attempts/${attemptId}`, "POST", { action: "finish" })).status, 403);
    assert.equal((await db.attempt.findUniqueOrThrow({ where: { id: attemptId } })).finishedAt, null);
    console.log("PASS SECURITY: another student cannot read or finish an attempt; database unchanged");
    assert.equal((await student(`/api/v1/attempts/${attemptId}`, "POST", { action: "answer", questionId: q.id, selectedIds: [correct], score: 999999 })).status, 400);
    assert.equal((await db.attempt.findUniqueOrThrow({ where: { id: attemptId } })).score, before.score);
    const accepted = await student(`/api/v1/attempts/${attemptId}`, "POST", { action: "answer", questionId: q.id, selectedIds: [correct] }); assert.equal(accepted.status, 200);
    assert.equal((await student(`/api/v1/attempts/${attemptId}`, "POST", { action: "answer", questionId: q.id, selectedIds: [correct] })).status, 409);
    assert.equal((await db.attempt.findUniqueOrThrow({ where: { id: attemptId } })).score, 1000);
    await student(`/api/v1/attempts/${attemptId}`, "POST", { action: "finish" });
    assert.equal((await student(`/api/v1/assignments/${assigned.data.id}`, "POST", {})).status, 403);
    console.log("PASS: answer and submission accepted after link expiry within the personal deadline");
    console.log("PASS SECURITY: score manipulation and duplicate answers rejected; score remains 1000");
    const game = await teacher(`/api/v1/quizzes/${quizId}/games`, "POST", {}); assert.equal(game.status, 200); const gameId = game.data.id;
    const gameRow = await db.game.findUniqueOrThrow({ where: { id: gameId } });
    await student("/api/v1/games/join", "POST", { pin: gameRow.pin }); await other("/api/v1/games/join", "POST", { pin: gameRow.pin });
    assert.equal((await student(`/api/v1/games/${gameId}`, "POST", { action: "next" })).status, 403);
    assert.equal((await db.game.findUniqueOrThrow({ where: { id: gameId } })).status, "WAITING");
    async function connect(request: ReturnType<typeof client>) {
      const ticket = await request("/api/v1/socket-ticket", "POST", {});
      // Match same-origin browser polling: browsers omit Origin on this GET.
      const s = io(base, { auth: { ticket: ticket.data.ticket }, transports: ["polling"], extraHeaders: { "Sec-Fetch-Site": "same-origin" }, autoConnect: false, reconnection: false }); sockets.push(s);
      await new Promise<void>((resolve, reject) => { const timeout = setTimeout(() => reject(new Error("Socket connect timeout")), 10000); s.on("connect", () => { clearTimeout(timeout); resolve(); }); s.on("connect_error", reject); s.connect(); });
      await new Promise<void>((resolve, reject) => s.timeout(10000).emit("watch", gameId, (err: Error | null, result: { error?: string }) => err || result.error ? reject(err || new Error(result.error)) : resolve())); return s;
    }
    const hostSocket = await connect(teacher), studentSocket = await connect(student); const otherSocket = await connect(other);
    async function command(s: Socket, body: object) { return new Promise<{ error?: string }>((resolve, reject) => s.timeout(10000).emit("command", body, (err: Error | null, result: { error?: string }) => err ? reject(err) : resolve(result))); }
    assert.equal((await command(hostSocket, { action: "next" })).error, undefined);
    assert.equal((await command(studentSocket, { action: "answer", questionIndex: 0, selectedIds: [correct] })).error, undefined);
    assert.ok((await command(studentSocket, { action: "answer", questionIndex: 0, selectedIds: [correct] })).error);
    const firstAnswer = await db.liveAnswer.findFirstOrThrow({ where: { participant: { gameId, userId: users[1] } } });
    await new Promise(resolve => setTimeout(resolve, 1000));
    assert.equal((await command(otherSocket, { action: "answer", questionIndex: 0, selectedIds: [correct] })).error, undefined);
    const secondAnswer = await db.liveAnswer.findFirstOrThrow({ where: { participant: { gameId, userId: users[2] } } });
    assert.ok(firstAnswer.score > secondAnswer.score);
    assert.ok(firstAnswer.score <= 1000 && secondAnswer.score >= 500);
    console.log("PASS: faster correct answer earns more points, calculated and persisted by server");
    studentSocket.disconnect(); await connect(student);
    await new Promise(resolve => setTimeout(resolve, 6000));
    const late = await other(`/api/v1/games/${gameId}`, "POST", { action: "answer", questionIndex: 0, selectedIds: [correct] }); assert.equal(late.status, 409);
    assert.equal(await db.liveAnswer.count({ where: { participant: { gameId } } }), 2);
    await command(hostSocket, { action: "next" });
    const final = await student(`/api/v1/games/${gameId}`); assert.equal(final.data.status, "FINISHED"); assert.equal(final.data.ranking.find((p: { me: boolean }) => p.me).score, firstAnswer.score);
    console.log("PASS: Socket.IO lobby, two students, host control, reconnect, timeout, duplicate rejection and persisted ranking");
  } finally {
    sockets.forEach(s => s.disconnect());
    await db.$transaction(async tx => {
      await tx.liveAnswer.deleteMany({ where: { participant: { game: { quizId: { in: quizzes } } } } });
      await tx.participant.deleteMany({ where: { game: { quizId: { in: quizzes } } } });
      await tx.game.deleteMany({ where: { quizId: { in: quizzes } } });
      await tx.attempt.deleteMany({ where: { userId: { in: users } } });
      await tx.assignment.deleteMany({ where: { quizId: { in: quizzes } } });
      await tx.quiz.deleteMany({ where: { id: { in: quizzes } } });
      await tx.user.deleteMany({ where: { id: { in: users } } });
    });
    await db.$disconnect(); console.log("Temporary integration records removed");
  }
}
main().catch(error => { console.error("FAIL", error.message); process.exitCode = 1; });
