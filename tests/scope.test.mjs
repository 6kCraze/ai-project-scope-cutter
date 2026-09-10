import test from "node:test";
import assert from "node:assert/strict";
import {
  isScopeResult,
  parseScopeRequest,
  formatScope,
} from "../src/lib/scope.ts";
import { createDemoScope, EXAMPLES } from "../src/lib/demo.ts";

test("request validation rejects bad types, unsupported budgets, and length boundaries", () => {
  for (const input of [
    null,
    [],
    {},
    { idea: 42, minutes: 30 },
    { idea: "a".repeat(9), minutes: 30 },
    { idea: "a".repeat(2001), minutes: 60 },
    { idea: "a".repeat(20), minutes: "30" },
    { idea: "a".repeat(20), minutes: 45 },
  ])
    assert.equal(parseScopeRequest(input), null);
  assert.deepEqual(
    parseScopeRequest({ idea: "  a".repeat(10).trim(), minutes: 30 })?.minutes,
    30,
  );
  assert.equal(
    parseScopeRequest({ idea: "a".repeat(2000), minutes: 60 })?.idea.length,
    2000,
  );
});

test("every demo category produces complete plans for both budgets", () => {
  for (const idea of [
    ...EXAMPLES.map((x) => x.idea),
    "Build a garden inventory tool",
    "a".repeat(2000),
  ]) {
    for (const minutes of [30, 60]) {
      const result = createDemoScope(idea, minutes);
      assert.ok(isScopeResult(result));
      assert.ok(result.codingPrompt.includes(idea));
      assert.ok(result.codingPrompt.includes(`${minutes} minutes`));
      assert.match(result.buildNow.at(-1), new RegExp(`–${minutes} min`));
    }
  }
});

test("60-minute plans add persistence while 30-minute plans keep state in memory", () => {
  const short = createDemoScope(EXAMPLES[0].idea, 30);
  const long = createDemoScope(EXAMPLES[0].idea, 60);
  assert.match(short.mvpSummary, /in memory/);
  assert.ok(long.buildNow.some((item) => item.includes("localStorage")));
  assert.ok(long.definitionOfDone.some((item) => item.includes("Reloading")));
  assert.notDeepEqual(short.buildNow, long.buildNow);
});

test("result validation rejects malformed, incomplete, oversized, or extra fields", () => {
  const result = createDemoScope(EXAMPLES[0].idea, 30);
  for (const value of [
    null,
    [],
    "text",
    { ...result, extra: true },
    { ...result, codingPrompt: " " },
    { ...result, mvpSummary: "a".repeat(1501) },
    { ...result, buildNow: [] },
    { ...result, buildNow: [1] },
    { ...result, buildNow: Array(9).fill("item") },
    { ...result, buildNow: ["a".repeat(1001)] },
    { ...result, definitionOfDone: undefined },
  ])
    assert.equal(isScopeResult(value), false);
});

test("full-plan export includes all seven sections and the complete prompt", () => {
  const result = createDemoScope(EXAMPLES[0].idea, 30);
  const markdown = formatScope(result);
  for (const title of [
    "MVP Summary",
    "Build Now",
    "Cut for Later",
    "Recommended Stack",
    "Definition of Done",
    "Future V2 Features",
    "Ready-to-paste AI coding prompt",
  ])
    assert.ok(markdown.includes(title));
  assert.ok(markdown.endsWith(result.codingPrompt));
});
