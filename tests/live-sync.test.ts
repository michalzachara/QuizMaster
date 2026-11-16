import { test } from "node:test";
import assert from "node:assert/strict";
import { refreshGames } from "../lib/live-sync";
import { gameStateForUser } from "../lib/game";

test("30 viewers share one game read per refresh without caching later refreshes", async () => {
  const viewers = Array.from({ length: 30 }, () => ({ data: { gameId: "game" } }));
  let reads = 0;
  let sent = 0;
  const load = async () => ({ version: ++reads });
  const send = (_viewer: unknown, game: { version: number }) => {
    assert.equal(game.version, reads);
    sent++;
  };
  const fail = () => assert.fail("Unexpected synchronization error");
  await refreshGames(viewers, load, send, fail);
  assert.equal(reads, 1);
  assert.equal(sent, 30);
  await refreshGames(viewers, load, send, fail);
  assert.equal(reads, 2);
  await refreshGames([], load, send, fail);
  assert.equal(reads, 2);
});

test("a failed game does not block other rooms and room switches skip old data", async () => {
  const broken = { data: { gameId: "broken" } };
  const moved = { data: { gameId: "old" } };
  const healthy = { data: { gameId: "healthy" } };
  const errors: unknown[] = [];
  const sent: unknown[] = [];
  await refreshGames(
    [broken, moved, healthy],
    async (id) => {
      if (id === "broken") throw new Error("Unavailable");
      if (id === "old") moved.data.gameId = "new";
      return id;
    },
    (viewer) => sent.push(viewer),
    (viewer) => errors.push(viewer),
  );
  assert.deepEqual(errors, [broken]);
  assert.deepEqual(sent, [healthy]);
});

test("shared game data keeps each student's answer private and checks membership", () => {
  const game = {
    id: "game",
    pin: "123456",
    status: "QUESTION",
    questionIndex: 0,
    deadline: new Date(Date.now() + 30000),
    quiz: { ownerId: "teacher" },
    snapshot: {
      title: "Quiz",
      questions: [
        {
          id: "q",
          text: "Question",
          type: "SINGLE",
          seconds: 30,
          points: 1000,
          options: [
            { id: "yes", text: "Yes", correct: true },
            { id: "no", text: "No", correct: false },
          ],
        },
      ],
    },
    participants: [
      {
        id: "p1",
        userId: "one",
        user: { name: "One" },
        answers: [{ questionIndex: 0, selectedIds: ["yes"], score: 900 }],
      },
      { id: "p2", userId: "two", user: { name: "Two" }, answers: [] },
    ],
  } as unknown as NonNullable<Parameters<typeof gameStateForUser>[1]>;
  const student = (id: string) => ({
    id,
    name: id,
    email: `${id}@example.invalid`,
    role: "STUDENT" as const,
    sessionVersion: 0,
  });
  const first = gameStateForUser(student("one"), game);
  const second = gameStateForUser(student("two"), game);
  assert.deepEqual(first.myAnswer, ["yes"]);
  assert.deepEqual(second.myAnswer, []);
  assert.deepEqual(second.correctIds, []);
  assert.ok(second.question?.options.every((option) => !("correct" in option)));
  assert.throws(() => gameStateForUser(student("outsider"), game), /dostępu/);
  game.status = "RESULTS";
  assert.deepEqual(gameStateForUser(student("two"), game).correctIds, ["yes"]);
});
