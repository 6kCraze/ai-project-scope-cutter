# Project Scope Cutter

Turn an overambitious product idea into a focused MVP you can ship in 30 or 60 minutes.

Project Scope Cutter takes a messy idea, finds one valuable workflow, and returns a practical build plan: what to build now, what to defer, a minimal stack, a definition of done, sensible V2 ideas, and a ready-to-paste AI coding prompt.

## Features

- 30-minute and 60-minute build plans
- Strict OpenAI Structured Outputs with runtime validation
- Useful template-based demo mode when no API key is configured
- Seven clear result sections with individual copy controls
- Full-plan and coding-prompt copy actions
- Responsive dark interface with loading and error states
- Three example projects and a live character count
- No accounts, database, analytics, or client-side secrets
- Generated favicon, Apple touch icon, and social preview image

## Quick start

Requirements: Node.js 20.9 or newer and npm.

```bash
git clone https://github.com/6kCraze/ai-project-scope-cutter.git
cd ai-project-scope-cutter
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works immediately in demo mode.

On Windows PowerShell, create the environment file with:

```powershell
Copy-Item .env.example .env.local
```

## OpenAI setup

Add a server-side API key to `.env.local` to enable AI-generated plans:

```dotenv
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
DEMO_MODE=false
```

`OPENAI_API_KEY` is read only by the route handler and is never sent to the browser. If the key is absent, or `DEMO_MODE=true`, the API returns a clearly labeled deterministic demo plan.

## How it works

```text
Browser form
    │  project idea + 30/60 minute timebox
    ▼
POST /api/scope
    ├─ validate request, origin, type, and body size
    ├─ OPENAI_API_KEY present → Responses API + strict JSON Schema
    └─ key absent → category-aware demo plan
    │
    ▼
validate all seven response fields
    │
    ▼
responsive result cards + copy actions
```

The OpenAI route uses the Responses API with `strict: true`, an explicit JSON Schema, bounded output, a timeout, and no response storage. The response is validated again before it leaves the server and once more before the client renders it.

## Project architecture

```text
src/
├── app/
│   ├── api/scope/route.ts    # request guardrails, OpenAI call, demo fallback
│   ├── layout.tsx            # metadata and fonts
│   ├── page.tsx              # server entry point and mode detection
│   ├── globals.css           # design system and responsive layout
│   └── *-icon / og image     # generated brand assets
├── components/
│   └── scope-cutter.tsx      # complete interactive experience
└── lib/
    ├── scope.ts              # shared types, schema, parsing, validation
    └── demo.ts               # deterministic preview-mode plans
tests/
├── scope.test.mjs            # validation and demo-plan unit tests
└── api.test.mjs              # running-server route integration tests
```

## Scripts

```bash
npm run dev        # local development
npm run lint       # ESLint
npm run typecheck  # generate route types and run TypeScript
npm test           # unit tests
npm run build      # production build
npm run start      # serve the production build
npm run test:api   # API integration tests; requires the app on port 3000
```

## Deploy to Vercel

1. Import this GitHub repository in Vercel.
2. Add `OPENAI_API_KEY` as an encrypted environment variable if you want live AI plans.
3. Optionally set `OPENAI_MODEL`; the default is `gpt-4.1-mini`.
4. Deploy. No other services or build settings are required.

Every branch and pull request runs lint, type checking, unit tests, and a production build through GitHub Actions.

## Response contract

```json
{
  "mvpSummary": "",
  "buildNow": [],
  "cutForLater": [],
  "recommendedStack": [],
  "definitionOfDone": [],
  "futureFeatures": [],
  "codingPrompt": ""
}
```

All fields are required. Unknown fields, empty strings, oversized values, and invalid arrays are rejected before rendering.

## Future improvements

- Let users refine one plan without expanding its timebox
- Add shareable, privacy-safe result links
- Offer stack presets for web apps, scripts, mobile apps, and automations
- Track anonymous success signals only after validating demand
- Add streaming progress for slower model responses

## License

MIT
