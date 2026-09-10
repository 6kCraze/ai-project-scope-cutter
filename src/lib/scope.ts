export const MAX_IDEA_LENGTH = 2000;
export type BuildMinutes = 30 | 60;

export interface ScopeResult {
  mvpSummary: string;
  buildNow: string[];
  cutForLater: string[];
  recommendedStack: string[];
  definitionOfDone: string[];
  futureFeatures: string[];
  codingPrompt: string;
}

const listKeys = [
  "buildNow",
  "cutForLater",
  "recommendedStack",
  "definitionOfDone",
  "futureFeatures",
] as const;
const keys = ["mvpSummary", ...listKeys, "codingPrompt"];
const stringSchema = { type: "string" };

export const scopeJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    mvpSummary: stringSchema,
    ...Object.fromEntries(
      listKeys.map((key) => [key, { type: "array", items: stringSchema }]),
    ),
    codingPrompt: stringSchema,
  },
  required: keys,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const validText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

/** Validate on both sides of the network boundary, including demo responses. */
export function isScopeResult(value: unknown): value is ScopeResult {
  return (
    isRecord(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key)) &&
    validText(value.mvpSummary, 1500) &&
    validText(value.codingPrompt, 12000) &&
    listKeys.every(
      (key) =>
        Array.isArray(value[key]) &&
        value[key].length >= 1 &&
        value[key].length <= 8 &&
        value[key].every((item) => validText(item, 1000)),
    )
  );
}

export function parseScopeRequest(
  value: unknown,
): { idea: string; minutes: BuildMinutes } | null {
  if (
    !isRecord(value) ||
    typeof value.idea !== "string" ||
    ![30, 60].includes(value.minutes as number)
  )
    return null;
  const idea = value.idea.trim();
  if (idea.length < 10 || idea.length > MAX_IDEA_LENGTH) return null;
  return { idea, minutes: value.minutes as BuildMinutes };
}

export function formatScope(result: ScopeResult): string {
  return [
    `# MVP Summary\n${result.mvpSummary}`,
    ...listKeys.map(
      (key, index) =>
        `## ${["Build Now", "Cut for Later", "Recommended Stack", "Definition of Done", "Future V2 Features"][index]}\n${result[key].map((item) => `- ${item}`).join("\n")}`,
    ),
    `## Ready-to-paste AI coding prompt\n${result.codingPrompt}`,
  ].join("\n\n");
}
