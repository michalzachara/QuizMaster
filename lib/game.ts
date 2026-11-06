import { database } from "./db";
import { AppError, type Actor, teacher, rateLimit } from "./security";
import { type Snapshot, publicQuestion, scoreAnswer, selectionSchema } from "./validation";
import { z } from "zod";

export async function joinGame(user: Actor, pin: string) {
  await rateLimit(`join:${user.id}`, 15);
  if (user.role !== "STUDENT") throw new AppError("Dołącz z konta ucznia.", 403);
  const game = await database().game.findUnique({ where: { pin } });
  if (!game) throw new AppError("Nie znaleziono rozgrywki.", 404);
  return database().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Game" WHERE id=${game.id} FOR UPDATE`;
    const current = await tx.game.findUniqueOrThrow({ where: { id: game.id } });
    const existing = await tx.participant.findUnique({ where: { gameId_userId: { gameId: game.id, userId: user.id } } });
    if (!existing && current.status !== "WAITING") throw new AppError("Rozgrywka już trwa. Dołączanie jest zamknięte.", 409);
    if (!existing) await tx.participant.create({ data: { gameId: game.id, userId: user.id } });
    return { id: game.id };
  });
}

export async function gameState(user: Actor, id: string) {
  const game = await database().game.findUnique({ where: { id }, include: { quiz: { select: { ownerId: true } }, participants: { include: { user: { select: { name: true } }, answers: true }, orderBy: { joinedAt: "asc" } } } });
  if (!game) throw new AppError("Nie znaleziono rozgrywki.", 404);
  const host = game.quiz.ownerId === user.id && user.role === "TEACHER";
  const me = game.participants.find(p => p.userId === user.id);
  if (!host && !me) throw new AppError("Nie masz dostępu do tej rozgrywki.", 403);
  const snapshot = game.snapshot as unknown as Snapshot;
  const q = snapshot.questions[game.questionIndex];
  const status = game.status === "QUESTION" && game.deadline && game.deadline <= new Date() ? "RESULTS" : game.status;
  const answered = me?.answers.find(a => a.questionIndex === game.questionIndex);
  return {
    id, pin: game.pin, title: snapshot.title, host, status, questionIndex: game.questionIndex,
    totalQuestions: snapshot.questions.length, deadline: game.deadline, serverTime: Date.now(),
    question: q ? publicQuestion(q) : null,
    correctIds: q && (status === "RESULTS" || status === "FINISHED") ? q.options.filter(o => o.correct).map(o => o.id) : [],
    answered: !!answered, myAnswer: answered?.selectedIds ?? [], myPoints: answered?.score ?? null,
    answeredCount: game.participants.filter(p => p.answers.some(a => a.questionIndex === game.questionIndex)).length,
    maxScore: snapshot.questions.reduce((sum, question) => sum + question.points, 0),
    ranking: game.participants.map(p => ({ id: p.id, name: p.user.name, me: p.userId === user.id, score: p.answers.reduce((sum, a) => sum + a.score, 0) })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)),
  };
}

export async function gameCommand(user: Actor, id: string, input: unknown) {
  const command = z.object({ action: z.enum(["next", "finish", "answer"]), questionIndex: z.number().int().optional(), selectedIds: selectionSchema.optional() }).strict().parse(input);
  await rateLimit(`game:${user.id}`, 100);
  return database().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Game" WHERE id=${id} FOR UPDATE`;
    const game = await tx.game.findUnique({ where: { id }, include: { quiz: { select: { ownerId: true } } } });
    if (!game) throw new AppError("Nie znaleziono rozgrywki.", 404);
    const now = new Date(); const snapshot = game.snapshot as unknown as Snapshot;
    if (command.action === "answer") {
      const participant = await tx.participant.findUnique({ where: { gameId_userId: { gameId: id, userId: user.id } } });
      if (!participant || user.role !== "STUDENT") throw new AppError("Brak uprawnień.", 403);
      if (game.status !== "QUESTION" || !game.deadline || now >= game.deadline || command.questionIndex !== game.questionIndex) throw new AppError("Czas na odpowiedź upłynął.", 409);
      const q = snapshot.questions[game.questionIndex]; const selected = command.selectedIds ?? [];
      if (selected.some(value => !q.options.some(o => o.id === value)) || (q.type !== "MULTIPLE" && selected.length !== 1)) throw new AppError("Nieprawidłowa odpowiedź.");
      await tx.liveAnswer.create({ data: { participantId: participant.id, questionIndex: game.questionIndex, selectedIds: selected, score: scoreAnswer(q, selected), answeredAt: now } });
    } else {
      teacher(user);
      if (game.quiz.ownerId !== user.id) throw new AppError("Brak uprawnień.", 403);
      if (game.status === "FINISHED") throw new AppError("Rozgrywka jest zakończona.", 409);
      if (command.action === "finish") await tx.game.update({ where: { id }, data: { status: "FINISHED", finishedAt: now } });
      else {
        if (game.status === "QUESTION" && game.deadline && game.deadline > now) throw new AppError("Poczekaj na zakończenie pytania.", 409);
        const index = game.questionIndex + 1;
        if (index === snapshot.questions.length) await tx.game.update({ where: { id }, data: { status: "FINISHED", finishedAt: now } });
        else await tx.game.update({ where: { id }, data: { status: "QUESTION", questionIndex: index, questionStartedAt: now, deadline: new Date(now.getTime() + snapshot.questions[index].seconds * 1000) } });
      }
    }
    return { ok: true };
  });
}
