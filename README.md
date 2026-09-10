# Project Scope Cutter

[![Quality checks](https://github.com/6kCraze/ai-project-scope-cutter/actions/workflows/ci.yml/badge.svg)](https://github.com/6kCraze/ai-project-scope-cutter/actions/workflows/ci.yml)

**Live site:** [ai-project-scope-cutter-six.vercel.app](https://ai-project-scope-cutter-six.vercel.app)

Project Scope Cutter is a small full-stack Next.js app that turns a huge project idea into something you can realistically build in **30 or 60 minutes**.

You give it the version of the idea with every feature you can think of. It gives you back a focused MVP, a short build plan, the features to save for later, a simple tech stack, a definition of done, and a detailed implementation brief.

## Why I built it

I like starting projects, but it is easy to turn a simple idea into a giant list of features before writing any code. Accounts, analytics, payments, dashboards, social features, and integrations all sound useful, but most of them do not belong in the first version.

I built this tool to force one decision: **what is the smallest useful version I can finish today?**

The goal is not to make the idea less interesting. The goal is to make the first version small enough to ship.

## What it does

1. Enter a project idea in your own words.
2. Pick a 30-minute or 60-minute timebox.
3. Click **Cut My Scope**.
4. Get a complete plan with:
   - MVP summary
   - What to build now
   - What to cut for later
   - Recommended stack
   - Definition of done
   - Future V2 features
   - A ready-to-paste coding prompt

The second version turns that plan into a small workspace:

- Choose your experience level, familiar stack, and whether setup is already done.
- Compare 30- and 60-minute plans side by side.
- Follow ordered tasks with an explicit time budget and a reason for each step.
- Cut or restore optional work. The remaining time becomes a buffer, and the coding prompt updates with the same decisions.
- Check off tasks and acceptance criteria, and log actual minutes against estimates.
- Save up to 10 plans in your browser, reopen them later, or delete them.
- Export the edited plan and build log as Markdown, or copy the full plan and coding prompt.

The public version runs the planner in the browser. It needs no account, API key, database, or paid AI service.

## How I worked through it

I built the project in small passes instead of trying to finish everything at once.

- I started with the main form and the 30/60-minute selector.
- I added the API route and made OpenAI return a strict JSON shape instead of unpredictable text.
- I added runtime validation on the server and in the browser so broken AI responses never reach the UI.
- I built a real demo mode so the project still works without an API key.
- I fixed local origin handling after browser testing found a `localhost` and `127.0.0.1` mismatch.
- I tested both timeboxes and adjusted the output so a 60-minute plan actually includes more than a 30-minute plan.
- I added loading, connection-error, character-limit, keyboard, copy, and mobile states.
- I finished with metadata, social images, API tests, CI, and a production build.

The next issue was that a generated plan was easy to read but hard to act on. I added task editing, progress tracking, a timebox comparison, and a build log. The main challenge was keeping the plan consistent: cutting local saving should also remove it from the stack and the implementation instructions.

I moved those decisions into a pure planning module and added a 90-case evaluation matrix. This checks budget totals and valid output across project ideas, experience levels, stacks, and both timeboxes. It tests consistency, not whether every developer can meet the estimate; that needs real usage feedback.

## Tech stack

- **Next.js App Router** for the UI and API route
- **TypeScript** for shared request and response types
- **Tailwind CSS** plus custom CSS for the responsive interface
- **OpenAI Responses API** with strict Structured Outputs
- **Vercel** for deployment

There is no authentication, database, dashboard, or client-side API key. Saved plans stay in versioned localStorage on the current browser. Saving is explicit; clearing browser data removes them, so Markdown export provides a portable copy.

## Run it locally

You need Node.js 20.9 or newer.

```bash
git clone https://github.com/6kCraze/ai-project-scope-cutter.git
cd ai-project-scope-cutter
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app starts in demo mode, so you can use the full interface without setting up OpenAI.

## Optional local AI

Copy the example environment file:

```bash
cp .env.example .env.local
```

For PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Then add your server-side key to `.env.local`:

```dotenv
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
DEMO_MODE=false
```

Restart `npm run dev` after editing the environment file. The API key is only read inside the local server route. It is never sent to the browser or saved with plans.

OpenAI usage may cost money and is billed to the key owner. It is entirely optional. The public deployment does not accept visitors' keys. Production builds and Vercel deployments always use the free planner, even if a key is accidentally configured. Local AI requires development mode, a key, and demo mode disabled.

## Validation and testing

The API checks the idea length, selected timebox, request size, content type, and request origin. AI output must match the exact seven-field response contract before it is rendered.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs these checks on every push and pull request. The tests cover request and response boundaries, 90 generated plan combinations, task cuts, persistence validation, and the production AI guard.

For API integration checks, start the app first, then run `npm run test:api`. Set `TEST_BASE_URL` if the server uses another port.

Browser checks cover generation, editing, save/reload, comparison, and desktop/mobile layout. The public plan generator is deterministic; no paid provider request is needed for testing.

## What I would add next

- Test the plans with developers and compare estimated time with their actual build logs.
- Add more domain-specific templates for ideas outside the current categories.
- Improve task estimates using that feedback instead of claiming every project fits perfectly.
- Add optional file import for sharing saved plans across browsers.

The current estimates are heuristics, not promises. Generic ideas get a generic prototype plan. That tradeoff keeps the public app fast, private, and free of AI API charges.

## License

MIT
