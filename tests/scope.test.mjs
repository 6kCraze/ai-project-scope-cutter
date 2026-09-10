import test from "node:test";
import assert from "node:assert/strict";
import {
  isScopeResult,
  parseScopeRequest,
  formatScope,
} from "../src/lib/scope.ts";
import { createDemoScope, EXAMPLES } from "../src/lib/demo.ts";
import {
  createTasks,
  editedResult,
  validPlan,
  defaults,
} from "../src/lib/planner.ts";
import { localAIEnabled } from "../src/lib/ai-mode.ts";

function makePlan(
  minutes = 60,
  preferences = defaults,
  idea = EXAMPLES[0].idea,
) {
  const base = createDemoScope(idea, minutes);
  return {
    id: "test",
    idea,
    minutes,
    preferences,
    base,
    tasks: createTasks(base, minutes, preferences),
    mode: "demo",
    excluded: [],
    completed: [],
    checks: [],
    actual: {},
    savedAt: new Date().toISOString(),
  };
}

test("evaluation matrix: budgets, profile variations and export contracts hold across 90 plans", () => {
  for (const idea of [
    ...EXAMPLES.map((x) => x.idea),
    "Build a garden inventory tool",
    "Build a habit tracker with reminders",
  ]) {
    for (const minutes of [30, 60])
      for (const experience of ["beginner", "comfortable", "experienced"])
        for (const stack of ["next", "react", "vanilla"]) {
          const plan = makePlan(
            minutes,
            { experience, stack, scaffold: false },
            idea,
          );
          assert.equal(
            plan.tasks.reduce((n, t) => n + t.minutes, 0),
            minutes,
          );
          assert.ok(plan.tasks.every((t) => t.minutes > 0));
          assert.ok(validPlan(plan, isScopeResult));
          assert.ok(isScopeResult(editedResult(plan)));
          assert.ok(editedResult(plan).codingPrompt.includes(idea));
        }
  }
});

test("cutting an optional task updates time, exclusions, persistence and coding instructions together", () => {
  const plan = makePlan();
  const optional = plan.tasks.find((t) => !t.required);
  plan.excluded = [optional.id];
  const result = editedResult(plan);
  assert.ok(!result.buildNow.some((t) => t.includes(optional.title)));
  assert.ok(result.cutForLater.some((t) => t.includes(optional.title)));
  assert.match(result.mvpSummary, /buffer/);
  assert.ok(!result.recommendedStack.some((t) => t.includes("localStorage")));
  assert.ok(
    !result.codingPrompt
      .split("DEFER THESE FEATURES")[0]
      .includes(optional.title),
  );
  assert.ok(!result.definitionOfDone.some((t) => /Reloading/.test(t)));
});

test("experience and existing starter change setup budget without extending the timebox", () => {
  const beginner = makePlan(30, { ...defaults, experience: "beginner" });
  const experienced = makePlan(30, { ...defaults, experience: "experienced" });
  const starter = makePlan(30, { ...defaults, scaffold: true });
  assert.ok(beginner.tasks[0].minutes > experienced.tasks[0].minutes);
  assert.ok(starter.tasks[0].minutes < experienced.tasks[0].minutes);
  assert.ok(beginner.tasks.length < experienced.tasks.length);
});

test("saved plans roundtrip progress and reject corrupt data or essential task exclusions", () => {
  const plan = makePlan();
  plan.completed = ["setup"];
  plan.actual = { setup: 8 };
  plan.checks = [0];
  assert.ok(validPlan(JSON.parse(JSON.stringify(plan)), isScopeResult));
  for (const value of [
    null,
    {},
    { ...plan, tasks: [null] },
    { ...plan, preferences: null },
    { ...plan, actual: { setup: -1 } },
    { ...plan, excluded: ["setup"] },
    { ...plan, completed: ["missing"] },
    { ...plan, checks: [99] },
    { ...plan, base: {} },
  ])
    assert.equal(validPlan(value, isScopeResult), false);
});

test("production and Vercel cannot call paid AI, even with a configured key", () => {
  const env = { OPENAI_API_KEY: "test-placeholder", DEMO_MODE: "false" };
  assert.equal(localAIEnabled({ ...env, NODE_ENV: "production" }), false);
  assert.equal(
    localAIEnabled({ ...env, NODE_ENV: "development", VERCEL: "1" }),
    false,
  );
  assert.equal(localAIEnabled({ ...env, NODE_ENV: "development" }), true);
  assert.equal(
    localAIEnabled({ ...env, NODE_ENV: "development", DEMO_MODE: "true" }),
    false,
  );
  assert.equal(localAIEnabled({ NODE_ENV: "development" }), false);
});

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
