"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { EXAMPLES } from "@/lib/demo";
import {
  formatScope,
  isScopeResult,
  MAX_IDEA_LENGTH,
  type BuildMinutes,
  type ScopeResult,
} from "@/lib/scope";

type IconName =
  | "cut"
  | "arrow"
  | "copy"
  | "check"
  | "clock"
  | "spark"
  | "code"
  | "close"
  | "stack"
  | "flag";
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    cut: (
      <>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="m8.2 8.2 12.8 12.8M14 10l7-7M8.2 15.8 12 12" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
        <path d="M20 2v4m-2-2h4" />
      </>
    ),
    code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    stack: (
      <path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5" />
    ),
    flag: <path d="M5 21V4c5-4 9 4 14 0v11c-5 4-9-4-14 0" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function CopyButton({
  text,
  label = "Copy",
  name,
}: {
  text: string;
  label?: string;
  name: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      try {
        if (!navigator.clipboard?.writeText) throw new Error();
        await navigator.clipboard.writeText(text);
      } catch {
        const field = document.createElement("textarea");
        field.value = text;
        field.setAttribute("readonly", "");
        field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error();
      }
      setState("copied");
      setTimeout(() => setState("idle"), 2200);
    } catch {
      setState("error");
    }
  }
  return (
    <span className="copy-wrap">
      <button
        type="button"
        className="copy-button"
        onClick={copy}
        aria-label={`Copy ${name}`}
      >
        <Icon name={state === "copied" ? "check" : "copy"} size={15} />
        <span>{state === "copied" ? "Copied!" : label}</span>
      </button>
      <span
        className={state === "error" ? "copy-error" : "sr-only"}
        role="status"
      >
        {state === "error"
          ? "Clipboard unavailable. Select and copy the text below."
          : state === "copied"
            ? `${name} copied`
            : ""}
      </span>
    </span>
  );
}

function ResultCard({
  title,
  subtitle,
  items,
  icon,
  tone = "neutral",
}: {
  title: string;
  subtitle: string;
  items: string[];
  icon: IconName;
  tone?: string;
}) {
  return (
    <section className={`result-card ${tone}`}>
      <div className="card-top">
        <span className="card-icon">
          <Icon name={icon} />
        </span>
        <CopyButton
          text={items.map((item) => `- ${item}`).join("\n")}
          name={title}
        />
      </div>
      <h3>{title}</h3>
      <p className="card-subtitle">{subtitle}</p>
      <ul className="result-list">
        {items.map((item, i) => (
          <li key={`${i}-${item}`}>
            <span className="list-marker">
              {tone === "keep" ? (
                <Icon name="check" size={14} />
              ) : tone === "cut" ? (
                <Icon name="close" size={13} />
              ) : (
                <span />
              )}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ScopeCutter({ demo }: { demo: boolean }) {
  const [idea, setIdea] = useState("");
  const [minutes, setMinutes] = useState<BuildMinutes>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState<{
    result: ScopeResult;
    mode: "ai" | "demo";
    minutes: BuildMinutes;
  } | null>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const valid = idea.trim().length >= 10;
  function fillExample(index: number) {
    setIdea(EXAMPLES[index].idea);
    setError("");
    inputRef.current?.focus();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (!valid) {
      setError("Give us a little more to work with — at least 10 characters.");
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    setError("");
    setOutput(null);
    try {
      const response = await fetch("/api/scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.trim(), minutes }),
        signal: AbortSignal.timeout(55000),
      });
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null)
        throw new Error(
          "We received an unreadable response. Please try again.",
        );
      if (!response.ok)
        throw new Error(
          "error" in data && typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again.",
        );
      if (
        !("result" in data) ||
        !isScopeResult(data.result) ||
        !("mode" in data) ||
        !["demo", "ai"].includes(String(data.mode))
      )
        throw new Error(
          "The plan didn’t pass our format checks. Please try again.",
        );
      setOutput({
        result: data.result,
        mode: data.mode as "ai" | "demo",
        minutes,
      });
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
          block: "start",
        });
        resultsRef.current?.focus({ preventScroll: true });
      });
    } catch (error) {
      setError(
        error instanceof Error && error.name === "TimeoutError"
          ? "That took too long. Please try again."
          : error instanceof TypeError
            ? "Connection interrupted. Check your internet and try again."
            : error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="site-shell">
      <a href="#cutter" className="skip-link">
        Skip to scope cutter
      </a>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Project Scope Cutter home">
          <span className="brand-icon">
            <Icon name="cut" size={21} />
          </span>
          <span>
            project<span className="brand-light">scope</span>
            <span className="brand-period">.</span>
          </span>
        </Link>
        <div className="header-right">
          <span className="header-note">
            A little less. A lot more shipped.
          </span>
          <a
            className="github-link"
            href="https://github.com/6kCraze/ai-project-scope-cutter"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" /> BIG IDEAS. SMALLER FIRST STEPS.
            </span>
            <h1 id="hero-title">
              Your idea is big.
              <br />
              Your first build
              <br className="desktop-break" />{" "}
              <span className="accent">shouldn’t be.</span>
            </h1>
            <p className="hero-description">
              Turn your “what if” into something you can ship.
              <br className="desktop-break" /> A focused MVP, a realistic plan,
              and a prompt
              <br className="desktop-break" /> to start building. All in one
              cut.
            </p>
            <div className="hero-proof">
              <span>
                <Icon name="check" size={15} /> No signup
              </span>
              <span>
                <Icon name="check" size={15} /> No overthinking
              </span>
              <span>
                <Icon name="check" size={15} /> Just ship
              </span>
            </div>
          </div>
          <div className="cutter-wrap" id="cutter">
            <div className="cutter-topline">
              <span>
                <span className="tiny-square" /> THE SCOPE CUTTER
              </span>
              <span>v1.0</span>
            </div>
            <form className="cutter-form" onSubmit={submit} aria-busy={loading}>
              <div className="form-heading">
                <label htmlFor="project-idea">What do you want to build?</label>
                <button
                  type="button"
                  className="example-button"
                  disabled={loading}
                  onClick={() => fillExample(0)}
                >
                  <Icon name="spark" size={14} /> Try an example
                </button>
              </div>
              <div className="textarea-wrap">
                <textarea
                  ref={inputRef}
                  id="project-idea"
                  placeholder="The big, ambitious, probably-too-many-features version. Don’t hold back."
                  value={idea}
                  maxLength={MAX_IDEA_LENGTH}
                  disabled={loading}
                  onChange={(event) => {
                    setIdea(event.target.value);
                    setError("");
                  }}
                  aria-describedby="input-help idea-count"
                />
                <div className="textarea-footer">
                  <span id="input-help">Start with the messy version.</span>
                  <span
                    id="idea-count"
                    className={idea.length === MAX_IDEA_LENGTH ? "accent" : ""}
                  >
                    {idea.length.toLocaleString()} <span>/ 2,000</span>
                  </span>
                </div>
              </div>
              <fieldset disabled={loading}>
                <legend>Your timebox</legend>
                <div className="segmented">
                  {([30, 60] as const).map((value) => (
                    <label
                      key={value}
                      className={minutes === value ? "selected" : ""}
                    >
                      <input
                        type="radio"
                        name="minutes"
                        value={value}
                        checked={minutes === value}
                        onChange={() => setMinutes(value)}
                      />
                      <Icon name="clock" size={18} />
                      <span>
                        {value} <span className="minute-label">minutes</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="timebox-hint">
                {minutes === 30
                  ? "One core feature. The smallest version that works."
                  : "One core feature, local saving, and room for polish."}
              </p>
              {error && (
                <div className="error-banner" role="alert">
                  <Icon name="flag" size={18} />
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                className="cut-button"
                disabled={loading || !valid}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Cutting through the extras…
                  </>
                ) : (
                  <>
                    <Icon name="cut" size={19} /> Cut My Scope{" "}
                    <Icon name="arrow" size={19} />
                  </>
                )}
              </button>
              <div className="form-footnote">
                <span className="status-dot" />
                {demo
                  ? "Demo mode · Try it. No API key needed."
                  : "Powered by OpenAI · Built for realistic first steps."}
              </div>
            </form>
            <div className="cut-line">
              <span />
              <Icon name="cut" size={16} />
            </div>
          </div>
        </section>
        <section className="examples-strip" aria-label="Example project ideas">
          <span>BIG IDEA ENERGY?</span>
          <div>
            {EXAMPLES.map((example, i) => (
              <button
                key={example.label}
                disabled={loading}
                onClick={() => fillExample(i)}
              >
                {example.label}
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <span className="examples-caption">We’ve all been there.</span>
        </section>
        {loading && (
          <section className="loading-panel" role="status" aria-live="polite">
            <div className="loading-heading">
              <span className="spinner" />
              <div>
                <h2>Less scope. More momentum.</h2>
                <p>
                  Finding the one thing worth shipping in {minutes} minutes…
                </p>
              </div>
            </div>
            <div className="skeleton-grid">
              {[0, 1, 2].map((i) => (
                <div className="skeleton-card" key={i}>
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          </section>
        )}
        {output && (
          <section
            ref={resultsRef}
            className="results"
            tabIndex={-1}
            aria-labelledby="results-heading"
          >
            <div className="results-heading">
              <div>
                <span className="eyebrow">
                  <span className="status-dot" /> YOUR NEXT SHIPPED PROJECT
                </span>
                <h2 id="results-heading">
                  Less, but <span className="accent">launchable.</span>
                </h2>
              </div>
              <CopyButton
                text={formatScope(output.result)}
                label="Copy full plan"
                name="full plan"
              />
            </div>
            <div className="result-meta">
              <span>
                <Icon name="clock" size={14} /> {output.minutes}-minute build
              </span>
              <span>
                {output.mode === "demo"
                  ? "Demo plan · Template-based, not AI-generated"
                  : "AI-generated · Your focused first version"}
              </span>
            </div>
            <section className="summary-card">
              <div>
                <div className="summary-top">
                  <span className="section-number">01 / THE FOCUS</span>
                  <CopyButton
                    text={output.result.mvpSummary}
                    name="MVP Summary"
                  />
                </div>
                <h3>MVP Summary</h3>
                <p>{output.result.mvpSummary}</p>
              </div>
              <div className="time-stamp">
                <strong>{output.minutes}</strong>
                <span>MINUTES TO BUILD</span>
              </div>
            </section>
            <div className="results-grid">
              <ResultCard
                title="Build Now"
                subtitle="This is the entire first version."
                items={output.result.buildNow}
                icon="check"
                tone="keep"
              />
              <ResultCard
                title="Cut for Later"
                subtitle="Good ideas. Wrong time."
                items={output.result.cutForLater}
                icon="cut"
                tone="cut"
              />
              <ResultCard
                title="Recommended Stack"
                subtitle="Familiar tools. Fewer moving parts."
                items={output.result.recommendedStack}
                icon="stack"
              />
              <ResultCard
                title="Definition of Done"
                subtitle="When these are true, ship it."
                items={output.result.definitionOfDone}
                icon="flag"
              />
            </div>
            <section className="future-card">
              <div>
                <span className="section-number">NEXT CHAPTER</span>
                <h3>Future V2 Features</h3>
                <p>Earn the next feature by shipping the first.</p>
                <CopyButton
                  text={output.result.futureFeatures.join("\n")}
                  name="Future V2 Features"
                />
              </div>
              <ol>
                {output.result.futureFeatures.map((item, i) => (
                  <li key={i}>
                    <span>0{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>
            <section className="prompt-card">
              <div className="prompt-heading">
                <div>
                  <span className="section-number">
                    <Icon name="code" size={15} /> FROM PLAN TO FIRST COMMIT
                  </span>
                  <h3>Your AI coding prompt</h3>
                  <p>Paste into your coding assistant. Start building.</p>
                </div>
                <CopyButton
                  text={output.result.codingPrompt}
                  label="Copy prompt"
                  name="coding prompt"
                />
              </div>
              <pre tabIndex={0}>{output.result.codingPrompt}</pre>
            </section>
            <p className="result-end">
              The best next step is a smaller first step.{" "}
              <a href="#cutter">
                Cut another idea <span aria-hidden="true">↑</span>
              </a>
            </p>
          </section>
        )}
        {!output && !loading && (
          <section className="how-it-works">
            <div className="how-heading">
              <span className="section-number">
                LESS PLANNING. MORE MAKING.
              </span>
              <h2>
                From someday to <span>shipped.</span>
              </h2>
            </div>
            <div className="steps-grid">
              {[
                {
                  number: "01",
                  title: "Bring the big idea",
                  copy: "The features, the integrations, the “and also…” — put it all on the table.",
                  icon: "spark",
                },
                {
                  number: "02",
                  title: "Make the cut",
                  copy: "Find the core value. Keep what matters. Give everything else a later.",
                  icon: "cut",
                },
                {
                  number: "03",
                  title: "Build something real",
                  copy: "Leave with a clear finish line and a coding prompt that gets you there.",
                  icon: "code",
                },
              ].map((step) => (
                <div className="step" key={step.number}>
                  <div className="step-top">
                    <span>{step.number}</span>
                    <Icon name={step.icon as IconName} size={21} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer className="site-footer">
        <span>
          Project Scope Cutter<span className="footer-dot"> / </span>Built for
          builders.
        </span>
        <span>Ship the small thing.</span>
      </footer>
    </div>
  );
}
