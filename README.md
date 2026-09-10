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

Each section has a copy button, and the whole plan can be copied at once.

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

That process kept the app small while still making it feel complete.

## Tech stack

- **Next.js App Router** for the UI and API route
- **TypeScript** for shared request and response types
- **Tailwind CSS** plus custom CSS for the responsive interface
- **OpenAI Responses API** with strict Structured Outputs
- **Vercel** for deployment

There is no authentication, database, dashboard, or client-side API key. The app only keeps the current result in browser memory.

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

## Use OpenAI mode

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

The API key is only read inside the server route. It is never sent to the browser or included in the repository.

## Deploy to Vercel

The project is set up for a standard Vercel deployment. It does not need a database or any other hosted service.

1. Import the GitHub repository into Vercel.
2. Keep the default Next.js build settings.
3. Deploy without environment variables to use demo mode.
4. Add `OPENAI_API_KEY` in the Vercel project settings when you want live OpenAI responses.
5. Redeploy after adding or changing environment variables.

The demo fallback is part of the server route, so the deployed site remains fully usable even when no API key is configured.

## Project structure

```text
src/
├── app/
│   ├── api/scope/route.ts    # OpenAI request and demo fallback
│   ├── globals.css           # responsive dark UI
│   ├── layout.tsx            # metadata and fonts
│   └── page.tsx              # page entry point
├── components/
│   └── scope-cutter.tsx      # form, states, results, and copy actions
└── lib/
    ├── demo.ts               # local demo plan generator
    └── scope.ts              # types, JSON schema, and validation
```

## Validation and testing

The API checks the idea length, selected timebox, request size, content type, and request origin. AI output must match the exact seven-field response contract before it is rendered.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs these checks on every push and pull request.

## What I would add next

- A way to refine a plan while keeping the same timebox
- Stack presets for web apps, scripts, mobile apps, and automations
- Shareable plan links with no personal project data exposed
- Streaming progress for slower AI responses

I would only add these after seeing how people use the current version. The whole point of this project is to ship the focused version first.

## License

MIT
