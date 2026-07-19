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
│   │   ├── nanny/[id]/             # /nanny/[id] — public-facing profile, requires a session
│   │   ├── admin/                  # /admin, /admin/nannies, /admin/parents — role: admin only
│   │   ├── api/                    # route handlers: ads, conversations, messages, profile, admin/*
│   │   ├── layout.tsx, page.tsx    # root layout + landing page
│   │   ├── error.tsx, not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Button, Input, Card, Badge, Avatar, icons
│   │   ├── layout/                 # Navbar, Footer
│   │   ├── brand/                  # BrandLogo, BrandWordmark
│   │   ├── admin/                  # AdminUserList (shared by /admin/nannies and /admin/parents)
│   │   ├── AdCard.tsx              # ad listing card (client component, image fallback)
│   │   └── MessageNannyButton.tsx  # shared "message this nanny" CTA (search, nanny profile)
│   ├── hooks/                      # useUser, useProfile
│   ├── lib/
│   │   ├── supabase/               # client.ts, server.ts, middleware.ts, requireAdmin.ts
│   │   ├── labels.ts               # shared JOB_TYPE_LABEL / AGE_RANGE_LABEL maps
│   │   └── utils/
│   ├── types/                      # mirrors the foxycare-db schema
│   └── proxy.ts                    # Next.js 16 middleware (session refresh + route protection + ban check)
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
| `/nanny/[id]` | authenticated | Public-facing nanny profile (view + message) — requires a session |
| `/admin`, `/admin/nannies`, `/admin/parents` | admin only | Stats overview; filterable nanny/parent lists with ban/unban |

### API (route handlers)

| Route | Methods | Purpose |
| ------- | --------- | --------- |
| `/api/ads` | `GET`, `POST` | List/filter ads; create an ad (nanny only, enforced by RLS) |
| `/api/ads/[id]` | `GET`, `PATCH`, `DELETE` | Single ad detail/edit/delete |
| `/api/profile` | `GET`, `PUT` | Current user's role-specific profile (`parent_profiles`/`nanny_profiles`) |
| `/api/conversations` | `GET`, `POST` | List the caller's conversations; find-or-create one with another user |
| `/api/messages` | `GET`, `POST` | Messages within a conversation |
| `/api/admin/stats` | `GET` | Total/online/banned user counts (admin only) |
| `/api/admin/users` | `GET` | Filterable nanny/parent list (admin only) |
| `/api/admin/users/[id]/ban`, `/unban` | `POST` | Sets/clears `users.is_banned` (admin only) — enforced entirely in app code, see [Environment Variables](#environment-variables) |

All data access goes through Supabase with Row Level Security as the actual security boundary — the API routes are a convenience layer, not the source of truth for authorization. The one exception is `users.is_banned`: RLS only guards *who* can flip it (admins, via `users_update_admin`), the actual sign-in block is app code (`LoginForm` + `proxy.ts`), not a database-level constraint — see [Environment Variables](#environment-variables) for why.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values from your Supabase project (Project Settings → API):

| Variable | Required | Description |
| ---------- | ---------- | -------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public anon/publishable key — safe for client-side use, RLS enforces access |
| `NEXT_PUBLIC_APP_URL` | yes | Base URL of the app (`http://localhost:3000` locally) |

No `SUPABASE_SERVICE_ROLE_KEY` is used anywhere in this app. Admin actions (e.g. banning) go through the normal anon-key client, gated by the `users.role = 'admin'` check in `requireAdmin()` and enforced by RLS — deliberately avoiding a bypass-everything key in the deployment.

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
2. In the Vercel project's **Settings → Environment Variables**, set the three variables listed [above](#environment-variables) for both **Production** and **Preview** — PR preview deployments need them too, or their build fails with `@supabase/ssr: Your project's URL and API key are required`. If a variable is marked **Sensitive** in the Vercel UI, it cannot also target **Development**; that's expected, keep using `.env.local` for local dev (`vercel env pull` won't fetch Sensitive values).
3. Vercel auto-detects Next.js and deploys on every push to `main`, with preview deployments for pull requests.
4. `NEXT_PUBLIC_APP_URL` isn't read anywhere in the code yet — it's reserved for when absolute URLs are needed (emails, OG tags). Set it to the deployed domain once known; a placeholder is harmless until then.

`package.json` pins `"engines": { "node": ">=22.0.0" }` — Vercel's default Node runtime satisfies this; no extra configuration is required for that.
