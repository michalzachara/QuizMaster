import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJoinCode } from "../lib/join-code";

test("pasting accepts six digit codes and formatted codes", () => {
  for (const value of ["123456", "123 456", "123\u00a0456", "123-456", " 123456\n"])
    assert.equal(parseJoinCode(value), "123456");
  assert.equal(parseJoinCode("001234"), "001234");
});

test("pasting a join link uses its PIN instead of the port", () => {
  assert.equal(parseJoinCode("http://localhost:3100/join?pin=123456"), "123456");
  assert.equal(parseJoinCode("https://quiz123.example/join?pin=001234"), "001234");
  for (const value of [
    "12345",
    "1234567",
    "http://localhost:3100/join",
    "https://quiz.example/join?pin=1234567",
    "abc123456",
  ])
    assert.equal(parseJoinCode(value), null);
});
