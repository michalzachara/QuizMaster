import { test } from "node:test";
import assert from "node:assert/strict";
import { quizInput, registrationSchema, scoreAnswer, publicQuestion, type Snapshot } from "../lib/validation";
const question: Snapshot["questions"][number] = { id: "q", text: "Wybierz dwie odpowiedzi", type: "MULTIPLE", seconds: 10, points: 1000, options: [{ id: "a", text: "A", correct: true }, { id: "b", text: "B", correct: true }, { id: "c", text: "C", correct: false }] };
test("scoring requires exactly the correct set and rejects duplicate or foreign IDs", () => {
  assert.equal(scoreAnswer(question, ["b", "a"]), 1000);
  for (const ids of [[], ["a"], ["a", "a"], ["a", "b", "c"], ["foreign"]]) assert.equal(scoreAnswer(question, ids), 0);
});
test("student question projection does not leak correct answers", () => {
  assert.equal(JSON.stringify(publicQuestion(question)).includes("correct"), false);
});
test("registration allows student or teacher, but rejects unknown roles and extra privileges", () => {
  const data = { name: "Osoba", email: "person@example.com", password: "Long-password-123" };
  assert.equal(registrationSchema.safeParse({ ...data, role: "STUDENT" }).success, true);
  assert.equal(registrationSchema.safeParse({ ...data, role: "TEACHER" }).success, true);
  assert.equal(registrationSchema.safeParse({ ...data, role: "ADMIN" }).success, false);
  assert.equal(registrationSchema.safeParse({ ...data, role: "STUDENT", isAdmin: true }).success, false);
});
test("quiz rejects missing correct answers and manipulated time or points", () => {
  const input = { title: "Test quiz", description: "", published: true, questions: [{ text: "Pytanie", type: "SINGLE", seconds: 30, points: 1000, options: [{ text: "A", correct: true }, { text: "B", correct: false }] }] };
  assert.equal(quizInput.safeParse(input).success, true);
  assert.equal(quizInput.safeParse({ ...input, questions: [{ ...input.questions[0], seconds: -10 }] }).success, false);
  assert.equal(quizInput.safeParse({ ...input, questions: [{ ...input.questions[0], points: 1000000 }] }).success, false);
  assert.equal(quizInput.safeParse({ ...input, questions: [{ ...input.questions[0], options: [{ text: "A", correct: false }, { text: "B", correct: false }] }] }).success, false);
});
