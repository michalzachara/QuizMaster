import { database } from "./db";
import { AppError, type Actor } from "./security";
import { type Snapshot, publicQuestion, scoreAnswer, selectionSchema } from "./validation";
import { z } from "zod";

export async function startAttempt(user: Actor, assignmentId: string) {
  if (user.role !== "STUDENT") throw new AppError("Rozpocznij test z konta ucznia.", 403);
  return database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id=${user.id} FOR UPDATE`;
    const assignment = await tx.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new AppError("Test nie istnieje.", 404);
    const now = new Date();
    const attempts = await tx.attempt.findMany({
      where: { assignmentId, userId: user.id },
      orderBy: { number: "desc" },
    });
    const active = attempts.find((a) => !a.finishedAt);
    if (active) return { id: active.id };
    if (assignment.opensAt > now || (assignment.closesAt && assignment.closesAt <= now))
      throw new AppError("Test nie jest teraz dostępny.", 403);
    if (attempts.length >= assignment.maxAttempts)
      throw new AppError("Wykorzystano limit podejść.", 409);
    const snapshot = assignment.snapshot as unknown as Snapshot;
    const attempt = await tx.attempt.create({
      data: {
        assignmentId,
        userId: user.id,
        number: attempts.length + 1,
        deadline: new Date(now.getTime() + assignment.timeLimitSeconds * 1000),
        maxScore: snapshot.questions.reduce((sum, q) => sum + q.points, 0),
      },
    });
    return { id: attempt.id };
  });
}

export async function attemptState(user: Actor, id: string) {
  const a = await database().attempt.findUnique({
    where: { id },
    include: { assignment: { include: { quiz: { select: { ownerId: true } } } } },
  });
  if (!a) throw new AppError("Nie znaleziono podejścia.", 404);
  if (a.userId !== user.id && !(user.role === "TEACHER" && a.assignment.quiz.ownerId === user.id))
    throw new AppError("Brak uprawnień.", 403);
  if (!a.finishedAt && a.deadline <= new Date()) {
    await database().attempt.updateMany({
      where: { id, finishedAt: null },
      data: { finishedAt: a.deadline },
    });
    a.finishedAt = a.deadline;
  }
  const snapshot = a.assignment.snapshot as unknown as Snapshot;
  const reveal = !!a.finishedAt && (a.assignment.revealAnswers || user.role === "TEACHER");
  return {
    id: a.id,
    title: snapshot.title,
    deadline: a.deadline,
    serverTime: Date.now(),
    finishedAt: a.finishedAt,
    score: a.finishedAt ? a.score : null,
    maxScore: a.maxScore,
    answers: a.answers,
    questions: snapshot.questions.map((q) => ({
      ...publicQuestion(q),
      ...(reveal ? { correctIds: q.options.filter((o) => o.correct).map((o) => o.id) } : {}),
    })),
  };
}

export async function answerAttempt(user: Actor, id: string, input: unknown) {
  const body = z
    .object({
      action: z.enum(["answer", "finish"]),
      questionId: z.string().optional(),
      selectedIds: selectionSchema.optional(),
    })
    .strict()
    .parse(input);
  return database().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Attempt" WHERE id=${id} FOR UPDATE`;
    const a = await tx.attempt.findUnique({ where: { id }, include: { assignment: true } });
    if (!a) throw new AppError("Nie znaleziono podejścia.", 404);
    if (a.userId !== user.id) throw new AppError("Brak uprawnień.", 403);
    if (a.finishedAt) throw new AppError("Test jest zakończony.", 409);
    const now = new Date();
    if (body.action === "finish" || now >= a.deadline) {
      await tx.attempt.update({
        where: { id },
        data: { finishedAt: now > a.deadline ? a.deadline : now },
      });
      return { ok: true, expired: now >= a.deadline };
    }
    const snapshot = a.assignment.snapshot as unknown as Snapshot;
    const q = snapshot.questions.find((q) => q.id === body.questionId);
    const selected = body.selectedIds ?? [];
    if (
      !q ||
      selected.some((id) => !q.options.some((o) => o.id === id)) ||
      (q.type !== "MULTIPLE" && selected.length !== 1)
    )
      throw new AppError("Nieprawidłowa odpowiedź.");
    const answers = a.answers as Record<string, string[]>;
    if (answers[q.id]) throw new AppError("Odpowiedź została już zapisana.", 409);
    answers[q.id] = selected;
    await tx.attempt.update({
      where: { id },
      data: { answers, score: { increment: scoreAnswer(q, selected) } },
    });
    return { ok: true };
  });
}
