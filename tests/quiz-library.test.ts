import { test } from "node:test";
import assert from "node:assert/strict";
import { filterQuizzes, readFavorites, type LibraryQuiz } from "../lib/quiz-library";

const quizzes: LibraryQuiz[] = [
  {
    id: "1",
    title: "Żółwie świata",
    description: "Biologia i przyroda",
    published: true,
    _count: { questions: 3 },
  },
  {
    id: "2",
    title: "Algebra",
    description: "Powtórka klasy ósmej",
    published: false,
    _count: { questions: 10 },
  },
  {
    id: "3",
    title: "Geografia",
    description: "Świat i podróże",
    published: true,
    _count: { questions: 5 },
  },
];
const defaults = {
  search: "",
  status: "all" as const,
  sort: "recent" as const,
  favoritesOnly: false,
  favorites: [] as string[],
};

test("library searches title and description without Polish accents and combines filters", () => {
  assert.deepEqual(
    filterQuizzes(quizzes, { ...defaults, search: "  zolwie przyroda  " }).map((q) => q.id),
    ["1"],
  );
  assert.deepEqual(
    filterQuizzes(quizzes, {
      ...defaults,
      status: "published",
      favoritesOnly: true,
      favorites: ["2", "3"],
    }).map((q) => q.id),
    ["3"],
  );
  assert.equal(
    filterQuizzes(quizzes, { ...defaults, status: "draft", search: "przyroda" }).length,
    0,
  );
});

test("library sorting does not change the original latest-first list", () => {
  assert.deepEqual(
    filterQuizzes(quizzes, { ...defaults, sort: "title" }).map((q) => q.id),
    ["2", "3", "1"],
  );
  assert.deepEqual(
    filterQuizzes(quizzes, { ...defaults, sort: "questions" }).map((q) => q.id),
    ["2", "3", "1"],
  );
  assert.deepEqual(
    filterQuizzes(quizzes, defaults).map((q) => q.id),
    ["1", "2", "3"],
  );
});

test("favorites tolerate corrupted storage and remove invalid IDs and duplicates", () => {
  assert.deepEqual(readFavorites("broken"), []);
  assert.deepEqual(readFavorites("null"), []);
  assert.deepEqual(readFavorites('["1", 3, null, "1", "2"]'), ["1", "2"]);
});
