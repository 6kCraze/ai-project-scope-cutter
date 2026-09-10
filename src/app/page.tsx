import ScopeCutter from "@/components/scope-cutter";

export default function Home() {
  const demo =
    process.env.DEMO_MODE === "true" || !process.env.OPENAI_API_KEY?.trim();
  return <ScopeCutter demo={demo} />;
}
