import { auth } from "@/auth";
import { database } from "@/lib/db";
import { AppError, checkOrigin, rateLimit, readBody, teacher, type Actor } from "@/lib/security";
import { assignmentInput, quizInput, registrationSchema, type Snapshot } from "@/lib/validation";
import { answerAttempt, attemptState, startAttempt } from "@/lib/attempts";
import { gameCommand, gameState, joinGame } from "@/lib/game";
import { socketTicket } from "@/lib/socket-ticket";
import { hash, verify, argon2id } from "argon2";
import { randomInt } from "node:crypto";
import { z, ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";

const orderedQuestions = { orderBy: { position: "asc" as const }, include: { options: { orderBy: { position: "asc" as const } } } };
async function actor(): Promise<Actor> {
  const session = await auth();
  if (!session?.user?.id) throw new AppError("Zaloguj się, aby kontynuować.", 401);
  const user = await database().user.findUnique({ where: { id: session.user.id } });
  if (!user || user.sessionVersion !== session.user.sessionVersion) throw new AppError("Sesja wygasła. Zaloguj się ponownie.", 401);
  return user;
}
async function ownedQuiz(user: Actor, id: string) {
  teacher(user);
  const quiz = await database().quiz.findFirst({ where: { id, ownerId: user.id }, include: { questions: orderedQuestions } });
  if (!quiz) throw new AppError("Nie znaleziono quizu.", 404);
  return quiz;
}
function snapshot(quiz: Awaited<ReturnType<typeof ownedQuiz>>): Snapshot {
  return { title: quiz.title, questions: quiz.questions.map(q => ({ id: q.id, text: q.text, type: q.type, seconds: q.seconds, points: q.points, options: q.options.map(o => ({ id: o.id, text: o.text, correct: o.correct })) })) };
}
async function dispatch(request: Request, path: string[]) {
  const [resource, id, action] = path;
  const db = database(); const method = request.method;
  if (method !== "GET") checkOrigin(request);
  if (resource === "register" && method === "POST") {
    await rateLimit("registration:global", 30, 60);
    const body = registrationSchema.parse(await readBody(request));
    await rateLimit(`registration:${body.email}`, 5, 300);
    const passwordHash = await hash(body.password, { type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    try { await db.user.create({ data: { email: body.email, name: body.name, passwordHash, role: body.role } }); }
    catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AppError("Nie można utworzyć konta. Spróbuj zalogować się lub użyj innego adresu.", 409); throw error; }
    return { ok: true };
  }
  const user = await actor();
  if (method !== "GET") await rateLimit(`api:${user.id}`, 120);
  if (resource === "me") {
    if (method === "GET") return { id: user.id, email: user.email, name: user.name, role: user.role };
    const body = z.object({ name: z.string().trim().min(2).max(60), currentPassword: z.string().max(128).optional(), password: z.string().min(10).max(128).optional() }).strict().parse(await readBody(request));
    const data: { name: string; passwordHash?: string; sessionVersion?: { increment: number } } = { name: body.name };
    if (body.password) {
      const current = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      if (!body.currentPassword || !await verify(current.passwordHash, body.currentPassword)) throw new AppError("Obecne hasło jest nieprawidłowe.");
      data.passwordHash = await hash(body.password, { type: argon2id }); data.sessionVersion = { increment: 1 };
    }
    await db.user.update({ where: { id: user.id }, data }); return { ok: true, signInAgain: !!body.password };
  }
  if (resource === "socket-ticket" && method === "POST") return { ticket: socketTicket(user) };
  if (resource === "dashboard" && method === "GET") {
    const quizzes = user.role === "TEACHER" ? await db.quiz.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { questions: true } } }, take: 100 }) : [];
    const attempts = await db.attempt.findMany({ where: user.role === "TEACHER" ? { assignment: { quiz: { ownerId: user.id } } } : { userId: user.id }, include: { user: { select: { name: true } }, assignment: { select: { snapshot: true } } }, orderBy: { startedAt: "desc" }, take: 100 });
    const games = await db.game.findMany({ where: user.role === "TEACHER" ? { quiz: { ownerId: user.id } } : { participants: { some: { userId: user.id } } }, select: { id: true, pin: true, status: true, createdAt: true, snapshot: true, _count: { select: { participants: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
    return { quizzes, attempts: attempts.map(a => ({ id: a.id, title: (a.assignment.snapshot as unknown as Snapshot).title, name: a.user.name, score: a.finishedAt || a.deadline <= new Date() ? a.score : null, maxScore: a.maxScore, finished: !!a.finishedAt || a.deadline <= new Date(), startedAt: a.startedAt })), games: games.map(g => ({ id: g.id, pin: g.pin, title: (g.snapshot as unknown as Snapshot).title, status: g.status, createdAt: g.createdAt, participants: g._count.participants })) };
  }
  if (resource === "quizzes") {
    teacher(user);
    if (method === "GET" && id) {
      const quiz = await ownedQuiz(user, id);
      const assignments = await db.assignment.findMany({ where: { quizId: id }, select: { id: true, opensAt: true, closesAt: true, maxAttempts: true, timeLimitSeconds: true }, orderBy: { opensAt: "desc" } });
      return { ...quiz, assignments };
    }
    if (method === "DELETE" && id) {
      await ownedQuiz(user, id);
      const references = await db.quiz.findUniqueOrThrow({ where: { id }, include: { _count: { select: { games: true, assignments: true } } } });
      if (references._count.games || references._count.assignments) throw new AppError("Ten quiz ma udostępnione testy lub rozgrywki. Zachowujemy go dla historii wyników.", 409);
      await db.quiz.delete({ where: { id, ownerId: user.id } }); return { ok: true };
    }
    if (method === "POST" && action === "duplicate") {
      const quiz = await ownedQuiz(user, id);
      const copy = await db.quiz.create({ data: { ownerId: user.id, title: `${quiz.title.slice(0, 110)} — kopia`, description: quiz.description, questions: { create: quiz.questions.map((q, position) => ({ text: q.text, type: q.type, seconds: q.seconds, points: q.points, position, options: { create: q.options.map((o, position) => ({ text: o.text, correct: o.correct, position })) } })) } } }); return { id: copy.id };
    }
    if (method === "POST" && action === "assignments") {
      const quiz = await ownedQuiz(user, id); if (!quiz.published) throw new AppError("Najpierw opublikuj quiz.");
      const body = assignmentInput.parse(await readBody(request));
      const a = await db.assignment.create({ data: { ...body, opensAt: new Date(body.opensAt), closesAt: body.closesAt ? new Date(body.closesAt) : null, quizId: id, snapshot: snapshot(quiz) } }); return { id: a.id };
    }
    if (method === "POST" && action === "games") {
      const quiz = await ownedQuiz(user, id); if (!quiz.published) throw new AppError("Najpierw opublikuj quiz.");
      for (let i = 0; i < 5; i++) {
        try { const game = await db.game.create({ data: { quizId: id, snapshot: snapshot(quiz), pin: String(randomInt(100000, 1000000)) } }); return { id: game.id }; }
        catch (error) { if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error; }
      } throw new AppError("Nie udało się wygenerować kodu. Spróbuj ponownie.", 503);
    }
    if ((method === "POST" && !id) || (method === "PUT" && id)) {
      const body = quizInput.parse(await readBody(request));
      if (id) await ownedQuiz(user, id);
      const questions = body.questions.map((q, position) => ({ ...q, position, options: { create: q.options.map((o, position) => ({ ...o, position })) } }));
      const quiz = await db.$transaction(async tx => {
        if (id) { await tx.question.deleteMany({ where: { quizId: id } }); return tx.quiz.update({ where: { id, ownerId: user.id }, data: { title: body.title, description: body.description, published: body.published, questions: { create: questions } } }); }
        return tx.quiz.create({ data: { ownerId: user.id, title: body.title, description: body.description, published: body.published, questions: { create: questions } } });
      }); return { id: quiz.id };
    }
  }
  if (resource === "assignments" && id) {
    if (method === "POST") return startAttempt(user, id);
    const a = await db.assignment.findUnique({ where: { id } });
    if (!a) throw new AppError("Test nie istnieje.", 404);
    const s = a.snapshot as unknown as Snapshot;
    return { id, title: s.title, questions: s.questions.length, opensAt: a.opensAt, closesAt: a.closesAt, maxAttempts: a.maxAttempts, timeLimitSeconds: a.timeLimitSeconds };
  }
  if (resource === "attempts" && id) return method === "GET" ? attemptState(user, id) : answerAttempt(user, id, await readBody(request));
  if (resource === "games" && id === "join" && method === "POST") { const { pin } = z.object({ pin: z.string().regex(/^\d{6}$/) }).strict().parse(await readBody(request)); return joinGame(user, pin); }
  if (resource === "games" && id) return method === "GET" ? gameState(user, id) : gameCommand(user, id, await readBody(request));
  throw new AppError("Nie znaleziono operacji.", 404);
}
async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  try { const result = await dispatch(request, (await context.params).path); return Response.json(result, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    if (error instanceof AppError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return Response.json({ error: error.issues[0]?.message || "Sprawdź dane formularza." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return Response.json({ error: "Ta odpowiedź została już zapisana." }, { status: 409 });
    console.error("API operation failed", error instanceof Error ? error.name : "UnknownError");
    return Response.json({ error: "Nie udało się wykonać operacji. Spróbuj ponownie." }, { status: 500 });
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
