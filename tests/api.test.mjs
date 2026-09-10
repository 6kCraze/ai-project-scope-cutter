import test from "node:test";
import assert from "node:assert/strict";
import { isScopeResult } from "../src/lib/scope.ts";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const post = (body, headers = {}) =>
  fetch(`${base}/api/scope`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });

test("demo API returns validated plans for 30 and 60 minutes", async () => {
  for (const minutes of [30, 60]) {
    const response = await post(
      JSON.stringify({
        idea: "An AI study platform with flashcards, quizzes, accounts and social features",
        minutes,
      }),
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.mode, "demo");
    assert.ok(isScopeResult(body.result));
  }
});

test("API rejects invalid JSON, idea lengths, budgets, media types, and origins", async () => {
  for (const body of [
    "{",
    "null",
    JSON.stringify({ idea: "short", minutes: 30 }),
    JSON.stringify({ idea: "a".repeat(2001), minutes: 30 }),
    JSON.stringify({ idea: "valid idea here", minutes: 45 }),
  ])
    assert.equal((await post(body)).status, 400);
  assert.equal(
    (await post("{}", { "Content-Type": "text/plain" })).status,
    415,
  );
  assert.equal(
    (await post("{}", { Origin: "https://example.com" })).status,
    403,
  );
  assert.equal(
    (await post(JSON.stringify({ idea: "a".repeat(17000), minutes: 30 })))
      .status,
    413,
  );
});
