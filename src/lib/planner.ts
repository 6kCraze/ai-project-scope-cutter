import type { BuildMinutes, ScopeResult } from "./scope";

export type Experience = "beginner" | "comfortable" | "experienced";
export type Stack = "next" | "react" | "vanilla";
export interface Preferences {
  experience: Experience;
  stack: Stack;
  scaffold: boolean;
}
export const defaults: Preferences = {
  experience: "comfortable",
  stack: "next",
  scaffold: false,
};
export interface Task {
  id: string;
  title: string;
  minutes: number;
  required: boolean;
  reason: string;
}
export interface Plan {
  id: string;
  idea: string;
  minutes: BuildMinutes;
  mode: "demo" | "ai";
  preferences: Preferences;
  base: ScopeResult;
  tasks: Task[];
  excluded: string[];
  completed: string[];
  checks: number[];
  actual: Record<string, number>;
  savedAt: string;
}
const stackNames: Record<Stack, string[]> = {
  next: ["Next.js App Router + TypeScript", "Tailwind CSS", "React state"],
  react: ["React + TypeScript with Vite", "Plain CSS", "React state"],
  vanilla: [
    "HTML + CSS + JavaScript",
    "Native form controls",
    "In-memory JavaScript state",
  ],
};
export function createTasks(
  base: ScopeResult,
  minutes: BuildMinutes,
  preferences: Preferences,
): Task[] {
  const source = base.buildNow.map((title) =>
    title.replace(/^\d+\s*[–-]\s*\d+\s*min\s*[·:—-]?\s*/i, ""),
  );
  // Reserve setup and verification time; the core work gets the remaining budget.
  const setup = preferences.scaffold
    ? 2
    : preferences.experience === "beginner"
      ? 9
      : preferences.experience === "experienced"
        ? 3
        : 5;
  const testing =
    preferences.experience === "beginner"
      ? 9
      : preferences.experience === "experienced"
        ? 5
        : 7;
  const core = source.slice(1, -1);
  if (!core.length) core.push(source[0] || "Implement the primary interaction");
  if (preferences.experience === "beginner") core.splice(2);
  else if (core.length === 2)
    core.push("Add sample input and a reset button for a smoother first use");
  const available = minutes - setup - testing;
  const tasks: Task[] = [
    {
      id: "setup",
      title: preferences.scaffold
        ? "Check the existing page and development server"
        : "Set up one page and the core form",
      minutes: setup,
      required: true,
      reason: "A working starting point prevents setup surprises later.",
    },
  ];
  core.forEach((title, i) =>
    tasks.push({
      id: `core-${i}`,
      title,
      minutes:
        Math.floor(available / core.length) +
        (i < available % core.length ? 1 : 0),
      required: i < 2,
      reason:
        i < 2
          ? "This connects the input to the main outcome. Keep it to prove the idea."
          : "This improves repeat use, but the primary interaction works without it.",
    }),
  );
  tasks.push({
    id: "verify",
    title:
      "Test valid and empty input, check mobile and keyboard use, then build and deploy",
    minutes: testing,
    required: true,
    reason: "A finished feature needs a working build and a usable interface.",
  });
  return tasks;
}
export function editedResult(plan: Plan): ScopeResult {
  const active = plan.tasks.filter((task) => !plan.excluded.includes(task.id));
  let elapsed = 0;
  const buildNow = active.map((task) => {
    const start = elapsed;
    elapsed += task.minutes;
    return `${start}–${elapsed} min · ${task.title}`;
  });
  const reserve = plan.minutes - elapsed;
  const cuts = plan.tasks
    .filter((task) => plan.excluded.includes(task.id))
    .map((task) => `${task.title} — deferred to protect the timebox`);
  const recommendedStack = [
    ...stackNames[plan.preferences.stack],
    ...(active.some((t) => /localStorage/.test(t.title))
      ? ["localStorage — save only in this browser"]
      : []),
  ];
  const definitionOfDone = [
    "Complete the selected tasks in the execution plan",
    "Valid input produces the core result and empty input shows a helpful message",
    "Controls work with a keyboard and the layout fits a phone",
    "The production build passes and the deployed page works",
  ];
  const mvpSummary = `${plan.base.mvpSummary.split(/Keep everything|Use the extra time|Ship in/)[0].trim()} ${elapsed} minutes of planned work${reserve ? `, with ${reserve} minutes kept as a buffer` : ""}.`;
  const cutForLater = [...cuts, ...plan.base.cutForLater].slice(0, 8);
  return {
    ...plan.base,
    mvpSummary,
    buildNow,
    cutForLater,
    recommendedStack,
    definitionOfDone,
    codingPrompt: `Build the following focused prototype.\n\nPROJECT CONTEXT\n${plan.idea}\n\nMVP\n${mvpSummary}\n\nBUILDER\n${plan.preferences.experience}; ${plan.preferences.scaffold ? "existing starter project" : "setup included"}. Time estimates are planning targets, not guarantees.\n\nIMPLEMENT ONLY THESE TASKS, IN ORDER\n${buildNow.join("\n")}\n\nSTACK\n${recommendedStack.join("\n")}\n\nDEFER THESE FEATURES\n${cutForLater.join("\n")}\n\nDEFINITION OF DONE\n${definitionOfDone.join("\n")}\n\nUse accessible controls, clear errors, and a responsive layout. Include setup instructions. Run the build and resolve errors. Stop when these criteria pass.`,
  };
}
// Persisted browser data is untrusted, including data from older releases.
export function validPlan(
  value: unknown,
  validateResult: (value: unknown) => boolean,
): value is Plan {
  if (!value || typeof value !== "object") return false;
  const p = value as Plan;
  return (
    typeof p.id === "string" &&
    p.id.length < 100 &&
    typeof p.idea === "string" &&
    p.idea.length <= 2000 &&
    [30, 60].includes(p.minutes) &&
    ["demo", "ai"].includes(p.mode) &&
    !!p.preferences &&
    ["beginner", "comfortable", "experienced"].includes(
      p.preferences.experience,
    ) &&
    ["next", "react", "vanilla"].includes(p.preferences.stack) &&
    typeof p.preferences.scaffold === "boolean" &&
    validateResult(p.base) &&
    Array.isArray(p.tasks) &&
    p.tasks.length >= 3 &&
    p.tasks.length <= 8 &&
    p.tasks.every(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.title === "string" &&
        t.title.length <= 1000 &&
        Number.isInteger(t.minutes) &&
        t.minutes > 0 &&
        typeof t.required === "boolean" &&
        typeof t.reason === "string",
    ) &&
    new Set(p.tasks.map((t) => t.id)).size === p.tasks.length &&
    p.tasks.reduce((n, t) => n + t.minutes, 0) <= p.minutes &&
    [p.excluded, p.completed].every(
      (list) =>
        Array.isArray(list) &&
        list.length <= 8 &&
        list.every((id) => p.tasks.some((t) => t.id === id)),
    ) &&
    !p.tasks.some((t) => t.required && p.excluded.includes(t.id)) &&
    Array.isArray(p.checks) &&
    p.checks.every((n) => Number.isInteger(n) && n >= 0 && n < 4) &&
    !!p.actual &&
    typeof p.actual === "object" &&
    Object.values(p.actual).every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 999,
    ) &&
    typeof p.savedAt === "string"
  );
}
