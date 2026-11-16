import { test } from "node:test";
import assert from "node:assert/strict";
import { assignmentDuration, assignmentInput, quizInput } from "../lib/validation";

test("assignment duration sums every question and adds exactly five minutes", () => {
  assert.equal(assignmentDuration([{ seconds: 30 }, { seconds: 60 }]), 390);
  assert.equal(assignmentDuration(Array.from({ length: 100 }, () => ({ seconds: 300 }))), 30300);
});

test("quizzes accept more than fifty questions", () => {
  const question = {
    text: "Pytanie",
    type: "SINGLE",
    seconds: 30,
    points: 1000,
    options: [
      { text: "Tak", correct: true },
      { text: "Nie", correct: false },
    ],
  };
  assert.equal(
    quizInput.safeParse({
      title: "Duży quiz",
      description: "",
      published: false,
      questions: Array.from({ length: 101 }, () => question),
    }).success,
    true,
  );
});

test("new assignment links require an expiration later than opening", () => {
  const value = {
    maxAttempts: 1,
    revealAnswers: false,
    opensAt: "2026-11-07T10:00:00.000Z",
    closesAt: "2026-11-07T11:00:00.000Z",
  };
  assert.equal(assignmentInput.safeParse(value).success, true);
  assert.equal(assignmentInput.safeParse({ ...value, closesAt: null }).success, false);
  assert.equal(assignmentInput.safeParse({ ...value, closesAt: value.opensAt }).success, false);
});
