import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10, "Hasło musi mieć przynajmniej 10 znaków.").max(128),
});
export const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(60),
  role: z.enum(["STUDENT", "TEACHER"], { error: "Wybierz typ konta." }),
}).strict();
export const questionInput = z.object({
  text: z.string().trim().min(1).max(1000),
  type: z.enum(["SINGLE", "MULTIPLE", "BOOLEAN"]),
  seconds: z.number().int().min(5).max(300),
  points: z.number().int().min(100).max(5000),
  options: z.array(z.object({ text: z.string().trim().min(1).max(300), correct: z.boolean() }).strict()).min(2).max(6),
}).strict().superRefine((q, ctx) => {
  const count = q.options.filter(o => o.correct).length;
  if (!count || (q.type !== "MULTIPLE" && count !== 1)) ctx.addIssue({ code: "custom", message: "Zaznacz poprawne odpowiedzi.", path: ["options"] });
  if (q.type === "BOOLEAN" && q.options.length !== 2) ctx.addIssue({ code: "custom", message: "Prawda/fałsz wymaga dwóch odpowiedzi.", path: ["options"] });
});
export const quizInput = z.object({ title: z.string().trim().min(3).max(120), description: z.string().max(1000), published: z.boolean(), questions: z.array(questionInput).min(1) }).strict();
export type QuizInput = z.infer<typeof quizInput>;
export type Snapshot = { title: string; questions: { id: string; text: string; type: "SINGLE" | "MULTIPLE" | "BOOLEAN"; seconds: number; points: number; options: { id: string; text: string; correct: boolean }[] }[] };
export const selectionSchema = z.array(z.string().min(1).max(100)).max(6).refine(a => new Set(a).size === a.length);
export const assignmentInput = z.object({ maxAttempts: z.number().int().min(1).max(10), opensAt: z.string().datetime(), closesAt: z.string().datetime(), revealAnswers: z.boolean() }).strict().refine(a => !a.closesAt || new Date(a.closesAt) > new Date(a.opensAt), "Koniec musi przypadać po początku.");
export function scoreAnswer(q: Snapshot["questions"][number], selected: string[]) {
  if (new Set(selected).size !== selected.length || selected.some(id => !q.options.some(o => o.id === id))) return 0;
  const correct = q.options.filter(o => o.correct).map(o => o.id);
  return correct.length === selected.length && correct.every(id => selected.includes(id)) ? q.points : 0;
}
export function publicQuestion(q: Snapshot["questions"][number]) {
  return { ...q, options: q.options.map(({ id, text }) => ({ id, text })) };
}

/** Live scoring uses server timestamps; individual assignments retain accuracy scoring. */
export function scoreTimedAnswer(q: Snapshot["questions"][number], selected: string[], startedAt: number, answeredAt: number, deadline: number) {
  if (![startedAt, answeredAt, deadline].every(Number.isFinite) || deadline <= startedAt || answeredAt < startedAt || answeredAt >= deadline) return 0;
  const fullScore = scoreAnswer(q, selected);
  const elapsedFraction = (answeredAt - startedAt) / (deadline - startedAt);
  return Math.round(fullScore * (1 - elapsedFraction / 2));
}

export function assignmentDuration(questions: { seconds: number }[]) { return questions.reduce((sum, q) => sum + q.seconds, 300); }
