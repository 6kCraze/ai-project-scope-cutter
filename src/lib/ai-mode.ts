/** Public production deployments never spend an owner's API credits. */
export function localAIEnabled(env: {
  NODE_ENV?: string;
  VERCEL?: string;
  DEMO_MODE?: string;
  OPENAI_API_KEY?: string;
}): boolean {
  return (
    env.NODE_ENV === "development" &&
    !env.VERCEL &&
    env.DEMO_MODE !== "true" &&
    !!env.OPENAI_API_KEY?.trim()
  );
}
