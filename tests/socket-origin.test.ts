import { test } from "node:test";
import assert from "node:assert/strict";
import { allowSocketOrigin } from "../lib/socket-origin";

test("accepts browser same-origin polling without Origin", () => {
  assert.equal(allowSocketOrigin(undefined, "same-origin", "http://localhost:3100"), true);
  assert.equal(allowSocketOrigin("http://localhost:3100", undefined, "http://localhost:3100/"), true);
});
test("rejects foreign origins and cross-site requests without Origin", () => {
  assert.equal(allowSocketOrigin("https://other.example", "same-origin", "http://localhost:3100"), false);
  assert.equal(allowSocketOrigin(undefined, "cross-site", "http://localhost:3100"), false);
  assert.equal(allowSocketOrigin("null", undefined, "http://localhost:3100"), false);
});
