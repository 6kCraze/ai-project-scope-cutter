"use client";

import { useState } from "react";
import { createDemoScope } from "@/lib/demo";
import { formatScope } from "@/lib/scope";
import { createTasks, editedResult, type Plan } from "@/lib/planner";

function Copy({ text, label }: { text: string; label: string }) {
  const [message, setMessage] = useState("");
  return (
    <span>
      <button
        className="copy-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setMessage("Copied");
          } catch {
            setMessage("Select the text to copy manually");
          }
        }}
      >
        {label}
      </button>
      <span className="copy-feedback" role="status">
        {message}
      </span>
    </span>
  );
}

export default function PlanWorkspace({
  plan,
  onChange,
  onSave,
}: {
  plan: Plan;
  onChange: (plan: Plan) => void;
  onSave: () => void;
}) {
  const [compare, setCompare] = useState(false);
  const result = editedResult(plan);
  const active = plan.tasks.filter((t) => !plan.excluded.includes(t.id));
  const planned = active.reduce((sum, t) => sum + t.minutes, 0);
  const actual = active.reduce((sum, t) => sum + (plan.actual[t.id] || 0), 0);
  const done = active.filter((t) => plan.completed.includes(t.id)).length;
  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  function download() {
    const progress = `\n\n## Build log\n${active.map((t) => `- [${plan.completed.includes(t.id) ? "x" : " "}] ${t.title} — ${t.minutes} min planned; ${plan.actual[t.id] ?? "not logged"} min actual`).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([formatScope(result) + progress], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "project-scope-plan.md";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="results workspace" aria-label="Your project plan">
      <div className="results-heading">
        <div>
          <span className="eyebrow">
            <span className="status-dot" /> YOUR BUILD WORKSPACE
          </span>
          <h2>
            Small scope. <span className="accent">Real progress.</span>
          </h2>
        </div>
        <button className="workspace-primary" onClick={onSave}>
          Save this plan
        </button>
      </div>
      <div className="result-meta">
        <span>{plan.minutes}-minute timebox</span>
        <span>
          {plan.preferences.experience} ·{" "}
          {plan.preferences.scaffold ? "starter ready" : "setup included"}
        </span>
        <span>
          {plan.mode === "demo"
            ? "Free · rule-based plan"
            : "Local AI · edited plan"}
        </span>
      </div>
      <section className="summary-card">
        <div>
          <span className="section-number">
            01 / YOUR FIRST SHIPPABLE VERSION
          </span>
          <h3>MVP Summary</h3>
          <p>{result.mvpSummary}</p>
          <p className="estimate-note">
            Planning targets, not guarantees. Use familiar tools and log actual
            time to learn what fits.
          </p>
        </div>
        <div className="time-stamp">
          <strong>{planned}</strong>
          <span>MINUTES PLANNED</span>
        </div>
      </section>
      <div className="workspace-toolbar">
        <button
          className="copy-button"
          aria-expanded={compare}
          onClick={() => setCompare(!compare)}
        >
          Compare 30 vs 60 minutes
        </button>
        <button className="copy-button" onClick={download}>
          Export Markdown ↓
        </button>
        <Copy text={formatScope(result)} label="Copy full plan" />
      </div>
      {compare && (
        <section className="compare-grid" aria-label="Timebox comparison">
          {([30, 60] as const).map((minutes) => {
            const base = createDemoScope(plan.idea, minutes);
            const tasks =
              minutes === plan.minutes
                ? active
                : createTasks(base, minutes, plan.preferences);
            return (
              <article
                key={minutes}
                className={
                  minutes === plan.minutes
                    ? "comparison selected-comparison"
                    : "comparison"
                }
              >
                <span className="section-number">
                  {minutes === plan.minutes
                    ? "CURRENT TIMEBOX"
                    : "ALTERNATIVE TIMEBOX"}
                </span>
                <h3>{minutes} minutes</h3>
                <ul>
                  {tasks.map((t) => (
                    <li key={t.id}>
                      {t.title} <strong>{t.minutes}m</strong>
                    </li>
                  ))}
                </ul>
                <p>
                  Rule-based comparison · changing timebox starts a fresh
                  checklist.
                </p>
                <button
                  className="copy-button"
                  disabled={minutes === plan.minutes}
                  onClick={() => {
                    onChange({
                      ...plan,
                      id: crypto.randomUUID(),
                      minutes,
                      base,
                      mode: "demo",
                      tasks,
                      excluded: [],
                      completed: [],
                      checks: [],
                      actual: {},
                    });
                    setCompare(false);
                  }}
                >
                  Use {minutes}-minute plan
                </button>
              </article>
            );
          })}
        </section>
      )}
      <section className="execution-card">
        <div className="execution-heading">
          <div>
            <span className="section-number">02 / BUILD NOW</span>
            <h3>Your execution plan</h3>
            <p>Work from top to bottom. Optional tasks can wait.</p>
          </div>
          <span className="progress-label">
            {done}/{active.length} complete
          </span>
        </div>
        <div
          className="budget-track"
          aria-label={`${planned} of ${plan.minutes} minutes allocated`}
        >
          {active.map((t, i) => (
            <span
              title={`${t.title}: ${t.minutes} min`}
              key={t.id}
              style={{
                width: `${(100 * t.minutes) / plan.minutes}%`,
                opacity: 1 - i * 0.11,
              }}
            />
          ))}
        </div>
        <div className="budget-caption">
          <span>
            {planned}m planned · {plan.minutes - planned}m buffer
          </span>
          <span>
            {actual}m logged
            {actual > planned ? ` · ${actual - planned}m over estimate` : ""}
          </span>
        </div>
        <ol className="task-list">
          {plan.tasks.map((task, i) => {
            const excluded = plan.excluded.includes(task.id);
            return (
              <li
                key={task.id}
                className={excluded ? "task-row deferred" : "task-row"}
              >
                <div className="task-main">
                  <input
                    aria-label={`Complete task ${i + 1}`}
                    type="checkbox"
                    disabled={excluded}
                    checked={!excluded && plan.completed.includes(task.id)}
                    onChange={() =>
                      onChange({
                        ...plan,
                        completed: toggle(plan.completed, task.id),
                      })
                    }
                  />
                  <div>
                    <span className="section-number">
                      STEP {String(i + 1).padStart(2, "0")} · {task.minutes} MIN
                      {task.required ? " · ESSENTIAL" : " · OPTIONAL"}
                    </span>
                    <h4>{task.title}</h4>
                    <details>
                      <summary>Why this is here</summary>
                      <p>
                        {task.reason}{" "}
                        {i > 0
                          ? "Start after the preceding selected task is working."
                          : "Start here."}
                      </p>
                    </details>
                  </div>
                </div>
                <div className="task-actions">
                  <label>
                    Actual min
                    <input
                      type="number"
                      min="0"
                      max="999"
                      step="1"
                      disabled={excluded}
                      value={plan.actual[task.id] ?? ""}
                      placeholder="—"
                      onChange={(e) => {
                        const actual = { ...plan.actual };
                        if (e.target.value === "") delete actual[task.id];
                        else
                          actual[task.id] = Math.min(
                            999,
                            Math.max(0, Math.round(Number(e.target.value))),
                          );
                        onChange({ ...plan, actual });
                      }}
                    />
                  </label>
                  {!task.required && (
                    <button
                      className="copy-button"
                      onClick={() =>
                        onChange({
                          ...plan,
                          excluded: toggle(plan.excluded, task.id),
                          completed: plan.completed.filter(
                            (id) => id !== task.id,
                          ),
                          checks: [],
                        })
                      }
                    >
                      {excluded ? "Restore task" : "Cut for later"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {done === active.length && (
          <p className="completion-note" role="status">
            Tasks complete. Check the definition of done below before calling it
            shipped.
          </p>
        )}
      </section>
      <div className="results-grid">
        <section className="result-card cut">
          <span className="section-number">03 / PROTECT THE TIMEBOX</span>
          <h3>Cut for Later</h3>
          <ul className="plain-list">
            {result.cutForLater.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <Copy text={result.cutForLater.join("\n")} label="Copy cuts" />
        </section>
        <section className="result-card">
          <span className="section-number">04 / FAMILIAR TOOLS</span>
          <h3>Recommended Stack</h3>
          <ul className="plain-list">
            {result.recommendedStack.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="card-subtitle">
            Based on your chosen stack. Fewer new tools means more time for the
            core feature.
          </p>
          <Copy text={result.recommendedStack.join("\n")} label="Copy stack" />
        </section>
      </div>
      <section className="execution-card">
        <span className="section-number">05 / THE FINISH LINE</span>
        <h3>Definition of Done</h3>
        <p>
          {plan.checks.length}/{result.definitionOfDone.length} acceptance
          checks passed
        </p>
        <div className="acceptance-list">
          {result.definitionOfDone.map((text, i) => (
            <label key={text}>
              <input
                type="checkbox"
                checked={plan.checks.includes(i)}
                onChange={() =>
                  onChange({
                    ...plan,
                    checks: plan.checks.includes(i)
                      ? plan.checks.filter((x) => x !== i)
                      : [...plan.checks, i],
                  })
                }
              />
              <span>{text}</span>
            </label>
          ))}
        </div>
        {done === active.length && plan.checks.length === 4 && (
          <p className="completion-note" role="status">
            Ready to ship. Export your build log and share what you made.
          </p>
        )}
      </section>
      <section className="future-card">
        <div>
          <span className="section-number">06 / NEXT CHAPTER</span>
          <h3>Future V2 Features</h3>
          <p>Let real usage choose what comes next.</p>
        </div>
        <ol>
          {result.futureFeatures.map((x, i) => (
            <li key={x}>
              <span>0{i + 1}</span>
              {x}
            </li>
          ))}
        </ol>
      </section>
      <section className="prompt-card">
        <div className="prompt-heading">
          <div>
            <span className="section-number">07 / READY TO BUILD</span>
            <h3>Your AI coding prompt</h3>
            <p>Updates with your selected tasks, stack, and timebox.</p>
          </div>
          <Copy text={result.codingPrompt} label="Copy prompt" />
        </div>
        <pre tabIndex={0}>{result.codingPrompt}</pre>
      </section>
    </section>
  );
}
