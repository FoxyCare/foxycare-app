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
- Tailwind CSS 3 — `brand` (terracotta) and `cream` colors in `tailwind.config.ts` are sourced from `public/logo.svg`; use those instead of ad-hoc colors like `indigo-*`
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) for auth, database access, and realtime
- Jest + Testing Library for unit tests

There is no payments, booking, or review feature by design — see `copilot_opis.md` at the workspace root for the full MVP spec.

---

## Folder Structure

```text
foxycare-app/
├── public/
│   └── logo.svg                    # brand logo (fox mark), served locally
├── src/
│   ├── app/
│   │   ├── (auth)/                 # /login, /register, /onboarding
│   │   ├── (protected)/            # /dashboard, /profile, /chat — require a session
│   │   ├── search/                 # /search — public, browsable without an account
│   │   ├── api/                    # route handlers: ads, conversations, messages, profile
│   │   ├── layout.tsx, page.tsx    # root layout + landing page
│   │   ├── error.tsx, not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Button, Input, Card, Badge, Avatar, icons
│   │   ├── layout/                 # Navbar, Footer
│   │   ├── brand/                  # BrandLogo, BrandWordmark
│   │   └── AdCard.tsx              # ad listing card (client component, image fallback)
│   ├── hooks/                      # useUser, useProfile
│   ├── lib/
│   │   ├── supabase/               # client.ts, server.ts, middleware.ts
│   │   └── utils/
│   ├── types/                      # mirrors the foxycare-db schema
│   └── proxy.ts                    # Next.js 16 middleware (session refresh + route protection)
├── tailwind.config.ts               # `brand` (terracotta) + `cream` color scale, sourced from the logo
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
| `/search` | **public** | Browse and filter ads — no account needed, matches the public `ads`/`nanny_profiles` RLS policies. Messaging a nanny from here prompts login. |
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
npm run lint       # ESLint (typescript-eslint + eslint-config-next flat config)
npx tsc --noEmit   # type-check
```

---

## Deployment (Vercel)

This is a zero-config Next.js app — no `vercel.json` needed. Steps:

1. Import the `FoxyCare/foxycare-app` GitHub repo into a new Vercel project.
2. In the Vercel project's **Settings → Environment Variables**, set the four variables listed [above](#environment-variables) for both **Production** and **Preview** — PR preview deployments need them too, or their build fails with `@supabase/ssr: Your project's URL and API key are required`. If a variable is marked **Sensitive** in the Vercel UI, it cannot also target **Development**; that's expected, keep using `.env.local` for local dev (`vercel env pull` won't fetch Sensitive values).
3. Vercel auto-detects Next.js and deploys on every push to `main`, with preview deployments for pull requests.
4. `NEXT_PUBLIC_APP_URL` isn't read anywhere in the code yet — it's reserved for when absolute URLs are needed (emails, OG tags). Set it to the deployed domain once known; a placeholder is harmless until then.

`package.json` pins `"engines": { "node": ">=22.0.0" }` — Vercel's default Node runtime satisfies this; no extra configuration is required for that.
