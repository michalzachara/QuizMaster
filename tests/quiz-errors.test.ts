import { test } from "node:test";
import assert from "node:assert/strict";
import { quizErrors } from "../lib/quiz-errors";
import type { QuizInput } from "../lib/validation";

test("editor associates validation errors with exact fields and clears repaired values", () => {
  const quiz: QuizInput = { title: "", description: "", published: false, questions: [{ text: "", type: "MULTIPLE", seconds: 0, points: 0, options: [{ text: "", correct: false }, { text: "B", correct: false }] }] };
  const errors = quizErrors(quiz);
  for (const path of ["title", "questions.0.text", "questions.0.seconds", "questions.0.points", "questions.0.options.0.text", "questions.0.options"]) assert.ok(errors[path], path);
  assert.equal(errors["questions.0.options.1.text"], undefined);
  quiz.title = "Poprawny quiz";
  assert.equal(quizErrors(quiz).title, undefined);
  quiz.questions[0] = { text: "Pytanie", type: "SINGLE", seconds: 30, points: 1000, options: [{ text: "A", correct: true }, { text: "B", correct: false }] };
  assert.deepEqual(quizErrors(quiz), {});
});
