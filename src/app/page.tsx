import { localAIEnabled } from "@/lib/ai-mode";
import ScopeCutter from "@/components/scope-cutter";

export default function Home() {
  const demo = !localAIEnabled(process.env);
  return <ScopeCutter demo={demo} />;
}
