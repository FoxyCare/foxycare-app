# foxycare-app

Next.js frontend + API for **FoxyCare** — an OLX-style classifieds marketplace connecting nannies with parents. Talks to a Supabase project whose schema lives in the sibling [`foxycare-db`](../foxycare-db) repo.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Routes](#routes)
4. [Environment Variables](#environment-variables)
5. [Local Development](#local-development)
6. [Testing & Linting](#testing--linting)
7. [Deployment (Vercel)](#deployment-vercel)

---

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 18 + TypeScript 5
- Tailwind CSS 3
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) for auth, database access, and realtime
- Jest + Testing Library for unit tests

There is no payments, booking, or review feature by design — see `copilot_opis.md` at the workspace root for the full MVP spec.

---

## Folder Structure

```text
foxycare-app/
├── public/
│   └── logo.png                    # brand logo, served locally (not an external URL)
├── src/
│   ├── app/
│   │   ├── (auth)/                 # /login, /register, /onboarding
│   │   ├── (protected)/            # /dashboard, /search, /profile, /chat — require a session
│   │   ├── api/                    # route handlers: ads, conversations, messages, profile
│   │   ├── layout.tsx, page.tsx    # root layout + landing page
│   │   ├── error.tsx, not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Button, Input, Card, Badge, Avatar
│   │   ├── layout/                 # Navbar, Footer
│   │   └── brand/                  # BrandLogo
│   ├── hooks/                      # useUser, useProfile
│   ├── lib/
│   │   ├── supabase/               # client.ts, server.ts, middleware.ts
│   │   └── utils/
│   ├── types/                      # mirrors the foxycare-db schema
│   └── proxy.ts                    # Next.js 16 middleware (session refresh + route protection)
├── .env.example
└── .devcontainer/
```

---

## Routes

### Pages

| Route | Access | Purpose |
| ------- | -------- | --------- |
| `/` | public | Landing page |
| `/login`, `/register` | public | Auth forms |
| `/onboarding` | authenticated | First-login profile setup (role-specific) |
| `/dashboard` | authenticated | Own ads (nanny) or a shortcut to search (parent) |
| `/search` | authenticated | Browse and filter ads |
| `/profile` | authenticated | Edit profile; nannies also manage their own ads here |
| `/chat` | authenticated | Conversations and messages |

### API (route handlers)

| Route | Methods | Purpose |
| ------- | --------- | --------- |
| `/api/ads` | `GET`, `POST` | List/filter ads; create an ad (nanny only, enforced by RLS) |
| `/api/ads/[id]` | `GET`, `PATCH`, `DELETE` | Single ad detail/edit/delete |
| `/api/profile` | `GET`, `PUT` | Current user's role-specific profile (`parent_profiles`/`nanny_profiles`) |
| `/api/conversations` | `GET`, `POST` | List the caller's conversations; find-or-create one with another user |
| `/api/messages` | `GET`, `POST` | Messages within a conversation |

All data access goes through Supabase with Row Level Security as the actual security boundary — the API routes are a convenience layer, not the source of truth for authorization.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values from your Supabase project (Project Settings → API):

| Variable | Required | Description |
| ---------- | ---------- | -------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon/publishable key — safe for client-side use, RLS enforces access |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Only needed for server-side calls that must bypass RLS (none currently) — keep secret if set |
| `NEXT_PUBLIC_APP_URL` | yes | Base URL of the app (`http://localhost:3000` locally) |

---

## Local Development

```bash
npm install
cp .env.example .env.local   # then fill in real Supabase values
npm run dev
```

The dev container already runs this via `postCreateCommand`. The schema this app expects lives in [`foxycare-db`](../foxycare-db) — apply its migrations (and optionally its seed data) to your Supabase project before using the app; see that repo's README.

---

## Testing & Linting

```bash
npm test          # Jest + Testing Library
npm run test:watch
npm run lint       # ESLint
npx tsc --noEmit   # type-check
```

---

## Deployment (Vercel)

This is a zero-config Next.js app — no `vercel.json` needed. Steps:

1. Import the `FoxyCare/foxycare-app` GitHub repo into a new Vercel project.
2. In the Vercel project's **Settings → Environment Variables**, set the four variables listed [above](#environment-variables) for the Production/Preview/Development environments as needed. For `NEXT_PUBLIC_APP_URL`, use the deployed domain (e.g. the Vercel-assigned URL or a custom domain).
3. Vercel auto-detects Next.js and deploys on every push to `main`, with preview deployments for pull requests.

`package.json` pins `"engines": { "node": ">=22.0.0" }` — Vercel's default Node runtime satisfies this; no extra configuration is required for that.
