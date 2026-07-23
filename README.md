# foxycare-app

Next.js frontend + API for **FoxyCare** — an OLX-style classifieds marketplace connecting nannies with parents. Talks to a Supabase project whose schema lives in the sibling [`foxycare-db`](../foxycare-db) repo.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Routes](#routes)
4. [Environment Variables](#environment-variables)
5. [OAuth Sign-In Setup](#oauth-sign-in-setup)
6. [Local Development](#local-development)
7. [Testing & Linting](#testing--linting)
8. [Deployment (Vercel)](#deployment-vercel)

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
│   │   ├── auth/callback/          # OAuth redirect target (Google/Facebook/Apple) — exchanges
│   │   │                           #   the code for a session, then routes to /onboarding
│   │   │                           #   (first sign-in) or /dashboard (returning user)
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
│   │   ├── auth/                   # OAuthButtons.tsx — Google/Facebook/Apple, shared by
│   │   │                           #   /login and /register
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
| `/login`, `/register` | public | Auth forms — email/password, or Google/Facebook/Apple via `OAuthButtons` |
| `/auth/callback` | public (route handler) | OAuth redirect target — see [OAuth Sign-In Setup](#oauth-sign-in-setup) |
| `/onboarding` | authenticated | First-login profile setup (role-specific); for a first-time OAuth sign-in this also collects role + terms acceptance, since providers don't let us attach that at signup the way email/password does |
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

## OAuth Sign-In Setup

`/login` and `/register` both render `OAuthButtons` (Google/Facebook/Apple) alongside the regular email/password form — email/password keeps working exactly as before, OAuth is additive. The app code is ready to go, but each provider needs a one-time setup in **its own developer console** plus enabling it in the **Supabase Dashboard** — none of this can be done from inside this repo, since it requires accounts/credentials this project doesn't have.

### 1. Enable providers in Supabase

Supabase Dashboard → your project → **Authentication → Providers**. Every provider you enable there needs a **Client ID** and **Client Secret** from that provider's own console (steps below), pasted into the matching fields. Supabase shows the exact **Redirect URL** to register with each provider on that same screen — it's always `https://<project-ref>.supabase.co/auth/v1/callback`, the same one for all three providers (this is Supabase's own callback, not this app's `/auth/callback` — the OAuth code lands there first, then Supabase forwards it on to whatever `redirectTo` the app passed, which is how it ends up at `/auth/callback` in this repo).

### 2. Google

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **Create OAuth client ID** (type: Web application).
2. Add the Supabase callback URL from step 1 under **Authorized redirect URIs**.
3. Copy the generated **Client ID** and **Client Secret** into Supabase's Google provider fields.

### 3. Facebook

1. [Meta for Developers](https://developers.facebook.com/) → Create App (type: Consumer) → add the **Facebook Login** product.
2. Facebook Login → Settings → add the Supabase callback URL under **Valid OAuth Redirect URIs**.
3. App Settings → Basic: copy the **App ID** and **App Secret** into Supabase's Facebook provider fields.
4. A Facebook app needs to go through **App Review** (or be run in Development Mode with test users added) before real, non-developer accounts can use it.

### 4. Apple

1. [Apple Developer](https://developer.apple.com/account/) (requires a paid Apple Developer Program membership) → Certificates, Identifiers & Profiles → create a **Services ID** — this is the "Client ID" Supabase asks for.
2. Under that Services ID's Sign In with Apple configuration, add the Supabase callback URL as the **Return URL**.
3. Apple's "Client Secret" isn't a static value — it's a signed JWT generated from a private key. Supabase's [Apple provider docs](https://supabase.com/docs/guides/auth/social-login/auth-apple) walk through generating it (Key ID, Team ID, and the `.p8` private key from an App ID's Sign In with Apple key).

### How the flow fits together in this app

- `OAuthButtons` (`src/components/auth/OAuthButtons.tsx`) calls `supabase.auth.signInWithOAuth()` with `redirectTo` pointing at this app's `/auth/callback` — on `/register` it also appends the currently-selected role (`?role=parent|nanny`) so a first-time sign-in respects it; `/login` sends none.
- `src/app/auth/callback/route.ts` exchanges the code for a session, then checks `users.terms_accepted_at`: already set → `/dashboard` (returning user); still null → applies the role param (if present) and sends the user to `/onboarding`.
- `/onboarding` shows a mandatory "role + accept terms" step whenever `terms_accepted_at` is null — this is the only path by which an OAuth sign-in records terms acceptance, since providers don't let the app attach custom signup metadata the way `supabase.auth.signUp()` does for email/password.
- `proxy.ts` is the actual enforcement, not just the happy-path redirect: any authenticated request to a protected route is bounced to `/onboarding` while `terms_accepted_at` is still null, so this can't be skipped by navigating straight to e.g. `/dashboard`.

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
