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
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`) for auth, database access, realtime, and Storage (nanny/parent profile photos, `avatars` bucket)
- Jest + Testing Library for unit tests

There is no payments-for-childcare, booking, or review feature by design — see `copilot_opis.md` at the workspace root for the full MVP spec. A nanny's profile *is* her one listing (no separate "ad" entity); it stays unpublished/unsearchable until she toggles it live in `/profile` — free self-service for now, intended to be gated by a real payment later (see `/terms` §6).

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
│   │   ├── nanny/[id]/             # /nanny/[id] — a single nanny's public listing; requires a
│   │   │                           #   session to view (proxy.ts), separately gated by
│   │   │                           #   nanny_profiles.is_published (RLS) for who it's visible to
│   │   ├── admin/                  # /admin, /admin/nannies, /admin/parents — role: admin only
│   │   ├── terms/, privacy/        # /terms, /privacy — public legal pages
│   │   ├── api/                    # route handlers: conversations, messages, profile, admin/*
│   │   ├── layout.tsx, page.tsx    # root layout + landing page
│   │   ├── error.tsx, not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                     # Button, Input, Card, Badge, Avatar, CheckboxGroup, icons
│   │   ├── layout/                 # Navbar, Footer
│   │   ├── brand/                  # BrandLogo, BrandWordmark
│   │   ├── admin/                  # AdminUserList (shared by /admin/nannies and /admin/parents;
│   │   │                           #   ban/unban + publish/unpublish + delete account)
│   │   ├── legal/                  # LegalDoc.tsx — Section/P/Ul shared by /terms and /privacy
│   │   ├── NannyCard.tsx           # search-results/homepage listing card
│   │   ├── NannyPhoto.tsx          # shared photo tile (fallback to initials) — NannyCard's
│   │   │                           #   cover photo and the bigger hero photo on /nanny/[id] and
│   │   │                           #   /profile both use this, not the small circular Avatar
│   │   └── MessageNannyButton.tsx  # shared "message this nanny" CTA (search, nanny profile)
│   ├── hooks/                      # useUser, useProfile
│   ├── lib/
│   │   ├── supabase/               # client.ts, server.ts, middleware.ts, requireAdmin.ts
│   │   ├── upload/                 # compressImage.ts (Canvas resize+WebP), uploadAvatar.ts
│   │   │                           #   (also exports deleteAvatar, used by account deletion)
│   │   ├── admin/                  # logAdminAction.ts — writes to admin_actions (RODO Art. 32)
│   │   ├── legal/                  # terms.ts, privacy.ts — TERMS_VERSION/PRIVACY_VERSION consts
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
| `/` | public | Landing page; featured published nanny listings |
| `/login`, `/register` | public | Auth forms |
| `/onboarding` | authenticated | First-login profile setup (role-specific) |
| `/dashboard` | authenticated | Publish status card + quick link to edit (nanny), or a shortcut to search (parent) |
| `/search` | **public** | Browse and filter **published** nanny listings — no account needed. Reads from the `nanny_public_profiles` view, not `nanny_profiles` directly (see [`foxycare-db`](../foxycare-db) for why). Messaging a nanny from here prompts login. |
| `/profile` | authenticated | Edit profile — nannies also set title/price/photo here and publish/unpublish their listing; also where a user deletes their own account (RODO Art. 17) |
| `/chat` | authenticated | Conversations and messages |
| `/nanny/[id]` | authenticated to view; separately gated by publish state | A single nanny's public listing (photo, title, price, description, contact). Requires a session (`proxy.ts`), and — independent of that — RLS only returns the row if it's published, or the caller is the owner or an admin; anyone else gets a 404, not an error |
| `/admin`, `/admin/nannies`, `/admin/parents` | admin only | Stats overview; filterable nanny/parent lists with ban/unban and (nannies) publish/unpublish |
| `/terms`, `/privacy` | public | Regulamin / Polityka Prywatności — required acceptance at registration, see [`src/lib/legal/`](src/lib/legal) |

### API (route handlers)

| Route | Methods | Purpose |
| ------- | --------- | --------- |
| `/api/profile` | `GET`, `PUT` | Current user's role-specific profile (`parent_profiles`/`nanny_profiles`) — nannies also PUT `title`/`price`/`is_published`/`published_at` here; no separate publish endpoint exists for self-service |
| `/api/account` | `DELETE` | Deletes the caller's own account — RODO Art. 17 self-service. Removes the avatar from Storage, then calls `delete_user_account` (see [`foxycare-db`](../foxycare-db)'s migration 0022); everything else cascades at the DB level |
| `/api/conversations` | `GET`, `POST` | List the caller's conversations; find-or-create one with another user |
| `/api/messages` | `GET`, `POST` | Messages within a conversation |
| `/api/admin/stats` | `GET` | Total/online/banned/published-profile counts (admin only) |
| `/api/admin/users` | `GET` | Filterable nanny/parent list (admin only) |
| `/api/admin/users/[id]/ban`, `/unban` | `POST` | Sets/clears `users.is_banned` (admin only) — enforced entirely in app code, see [Environment Variables](#environment-variables) |
| `/api/admin/users/[id]/publish`, `/unpublish` | `POST` | Sets/clears `nanny_profiles.is_published` (admin only) — moderation override alongside the nanny's own self-service toggle in `/profile` |
| `/api/admin/users/[id]/delete` | `POST` | Admin-triggered account deletion — for erasure requests from accounts that can't act for themselves (e.g. banned users, per `/terms` §12) |

All data access goes through Supabase with Row Level Security as the actual security boundary — the API routes are a convenience layer, not the source of truth for authorization. Two exceptions: `users.is_banned` (RLS only guards *who* can flip it; the sign-in block itself is app code — `LoginForm` + `proxy.ts`) and, more mildly, `nanny_profiles.is_published` (RLS fully enforces *read* visibility, but the self-service *write* path has no payment gate yet — see [`foxycare-db`](../foxycare-db)'s migration 0020 comments and `/terms` §6).

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
