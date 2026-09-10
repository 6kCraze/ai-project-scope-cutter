"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import PlanWorkspace from "./plan-workspace";
import {
  createTasks,
  defaults,
  validPlan,
  type Plan,
  type Preferences,
} from "@/lib/planner";
import { createDemoScope, EXAMPLES } from "@/lib/demo";
import { isScopeResult, MAX_IDEA_LENGTH, type BuildMinutes } from "@/lib/scope";

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

export default function ScopeCutter({ demo }: { demo: boolean }) {
  const [idea, setIdea] = useState("");
  const [minutes, setMinutes] = useState<BuildMinutes>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [output, setOutput] = useState<Plan | null>(null);
  const [saved, setSaved] = useState<Plan[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const storageKey = "scope-cutter-plans-v2";
  function readSaved() {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(raw) || !raw.every((p) => validPlan(p, isScopeResult)))
        throw new Error();
      return raw.slice(0, 10) as Plan[];
    } catch {
      setNotice(
        "Saved plans could not be read. You can still build and export a new plan.",
      );
      return [];
    }
  }
  function savePlan() {
    if (!output) return;
    const next = [
      { ...output, savedAt: new Date().toISOString() },
      ...readSaved().filter((p) => p.id !== output.id),
    ].slice(0, 10);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSaved(next);
      setNotice(
        "Saved in this browser. Save again after changing your progress.",
      );
    } catch {
      setNotice(
        "Browser storage is unavailable or full. Export Markdown to keep your plan.",
      );
    }
  }
  function removePlan(id: string) {
    const next = readSaved().filter((p) => p.id !== id);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSaved(next);
      setNotice("Plan removed from this browser.");
    } catch {
      setNotice("Could not update browser storage.");
    }
  }
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
      let result = createDemoScope(idea.trim(), minutes);
      let mode: "ai" | "demo" = "demo";
      if (!demo) {
        const response = await fetch("/api/scope", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea: idea.trim(), minutes }),
          signal: AbortSignal.timeout(55000),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not generate this plan.");
        if (!isScopeResult(data.result) || !["ai", "demo"].includes(data.mode))
          throw new Error("The plan did not pass validation.");
        result = data.result;
        mode = data.mode;
      }
      if (!isScopeResult(result))
        throw new Error("The plan did not pass validation.");
      setOutput({
        id: crypto.randomUUID(),
        idea: idea.trim(),
        base: result,
        mode,
        minutes,
        preferences: { ...preferences },
        tasks: createTasks(result, minutes, preferences),
        excluded: [],
        completed: [],
        checks: [],
        actual: {},
        savedAt: "",
      });
      setNotice("");
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
              <span>v2.0</span>
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
              <div className="preferences-grid">
                <label>
                  Your experience
                  <select
                    disabled={loading}
                    value={preferences.experience}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        experience: e.target.value as Preferences["experience"],
                      })
                    }
                  >
                    <option value="beginner">Learning the basics</option>
                    <option value="comfortable">Comfortable building</option>
                    <option value="experienced">Experienced developer</option>
                  </select>
                </label>
                <label>
                  Familiar stack
                  <select
                    disabled={loading}
                    value={preferences.stack}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        stack: e.target.value as Preferences["stack"],
                      })
                    }
                  >
                    <option value="next">Next.js + TypeScript</option>
                    <option value="react">React + Vite</option>
                    <option value="vanilla">HTML, CSS, JavaScript</option>
                  </select>
                </label>
              </div>
              <label className="starter-option">
                <input
                  type="checkbox"
                  disabled={loading}
                  checked={preferences.scaffold}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      scaffold: e.target.checked,
                    })
                  }
                />{" "}
                I already have a working starter project
              </label>
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
                  ? "Free planner · Runs in your browser. No API key."
                  : "Powered by OpenAI · Built for realistic first steps."}
              </div>
            </form>
            <div className="cut-line">
              <span />
              <Icon name="cut" size={16} />
            </div>
          </div>
        </section>
        <section className="library-bar">
          <div>
            <strong>Your plans, your browser.</strong>
            <p>No account. Save up to 10 plans with task progress.</p>
          </div>
          <button
            className="copy-button"
            aria-expanded={libraryOpen}
            onClick={() => {
              setSaved(readSaved());
              setLibraryOpen(!libraryOpen);
            }}
          >
            Saved plans {libraryOpen ? "↑" : "↓"}
          </button>
        </section>
        {libraryOpen && (
          <section className="saved-library" aria-label="Saved plans">
            {saved.length === 0 ? (
              <p>No saved plans yet. Make a cut, then save your plan.</p>
            ) : (
              saved.map((p) => (
                <article key={p.id}>
                  <div>
                    <h3>{p.idea}</h3>
                    <p>
                      {p.minutes} minutes · {p.preferences.experience} ·{" "}
                      {new Date(p.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <button
                      className="copy-button"
                      onClick={() => {
                        setOutput(p);
                        setIdea(p.idea);
                        setMinutes(p.minutes);
                        setPreferences(p.preferences);
                        setNotice(
                          "Saved plan restored. Changes are saved when you click Save this plan.",
                        );
                      }}
                    >
                      Open plan
                    </button>
                    <button
                      className="copy-button"
                      onClick={() => removePlan(p.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
        <details className="local-ai-guide">
          <summary>Free planner + optional local AI</summary>
          <p>
            The public app uses rules and templates entirely in your browser. No
            API key is needed, and project ideas are not sent to an AI provider.
            For custom AI plans, run the project on your own computer and add
            your own key to the server environment. Provider usage may cost
            money; it is optional. Production builds always use the free
            planner.
          </p>
          <a
            href="https://github.com/6kCraze/ai-project-scope-cutter#optional-local-ai"
            target="_blank"
            rel="noreferrer"
          >
            Local setup instructions ↗
          </a>
        </details>
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
        {notice && (
          <p className="storage-notice" role="status">
            {notice}
          </p>
        )}
        {output && (
          <section ref={resultsRef} tabIndex={-1}>
            <PlanWorkspace
              key={output.id}
              plan={output}
              onChange={(next) => {
                setOutput(next);
                if (next.id !== output.id) {
                  setMinutes(next.minutes);
                  setNotice("New timebox selected. Save this plan to keep it.");
                }
              }}
              onSave={savePlan}
            />
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
