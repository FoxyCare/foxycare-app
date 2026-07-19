# FOXYCARE — ULTRATECHNICZNY OPIS PROJEKTU (SPEC v3)

## 1. Cel projektu
FoxyCare to platforma ogłoszeniowa typu OLX, dedykowana branży niań.
MVP obejmuje:
- wystawianie ogłoszeń przez nianie,
- filtrowanie ogłoszeń przez rodziców,
- wysyłanie wiadomości,
- przeglądanie profili,
- zarządzanie ogłoszeniami.

Brak płatności, brak rezerwacji, brak bookingów.

## 2. Architektura
Model: Serverless + Edge + Modular Monorepo

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript 5.x
- Tailwind CSS 3.x
- shadcn/ui
- Zustand/Jotai
- Next Image / Next Fonts

### Backend
- Supabase Postgres 15
- Supabase Auth (GoTrue)
- Supabase Storage
- Supabase Realtime (CDC)
- Supabase RPC (opcjonalnie)

### DevOps
- Docker
- VS Code Dev Containers (cross-platform)
- pnpm
- GitHub Actions
- Vercel (frontend + API)
- Supabase Cloud (DB)

## 3. Funkcjonalności (MVP)

### 3.1 Ogłoszenia
Niania:
- dodawanie ogłoszeń,
- edycja,
- usuwanie,
- zdjęcia,
- parametry:
  - doświadczenie (lata),
  - wiek dzieci (np. 0–3, 3–6, 6+),
  - typ pracy (stała/dorywcza),
  - lokalizacja,
  - opis,
  - stawka (opcjonalnie).

Rodzic:
- przeglądanie ogłoszeń,
- filtrowanie,
- sortowanie po dacie.

### 3.2 Filtrowanie
Filtry:
- doświadczenie (min/max),
- wiek dzieci,
- typ pracy,
- lokalizacja,
- stawka (opcjonalnie),
- dostępność (tekstowo).

### 3.3 Wiadomości
- wysyłanie wiadomości parent ↔ nanny,
- realtime updates (Supabase Realtime),
- lista konwersacji,
- oznaczanie jako przeczytane.

### 3.4 Profile
Niania:
- imię, nazwisko,
- zdjęcie,
- doświadczenie,
- wiek dzieci,
- typ pracy,
- lokalizacja,
- opis.

Rodzic:
- imię,
- lokalizacja,
- avatar (opcjonalnie).

### 3.5 Brak funkcji (MVP)
- brak płatności,
- brak rezerwacji,
- brak bookingów,
- brak kalendarza dostępności,
- brak recenzji.

## 4. Supabase — struktura bazy danych

### Tabele

#### users
- id (uuid)
- email
- role (parent/nanny)
- created_at

#### nanny_profiles
- user_id
- experience_years
- children_age_range
- job_type
- location
- description
- avatar_url

#### parent_profiles
- user_id
- location
- avatar_url

#### ads
- id
- nanny_id (FK → users)
- title
- description
- experience_years
- children_age_range
- job_type
- location
- price (opcjonalnie)
- created_at
- updated_at

#### ad_images
- id
- ad_id
- image_url

#### conversations
- id
- user1_id
- user2_id
- last_message_at

#### messages
- id
- conversation_id
- sender_id
- receiver_id
- content
- created_at
- read_at

### Relacje
- users (1) — (1) nanny_profiles
- users (1) — (1) parent_profiles
- users (1) — (N) ads
- ads (1) — (N) ad_images
- users (1) — (N) conversations (as user1/user2)
- conversations (1) — (N) messages

### Indeksy
- idx_ads_location
- idx_ads_experience
- idx_ads_children_age_range
- idx_ads_job_type
- idx_messages_conversation_id
- idx_conversations_last_message_at

## 5. RLS Policies

  ### ads
  SELECT: public  
  INSERT: nanny_id = auth.uid()  
  UPDATE: nanny_id = auth.uid()  
  DELETE: nanny_id = auth.uid()  

  ### messages
  SELECT: sender_id = auth.uid() OR receiver_id = auth.uid()  
  INSERT: sender_id = auth.uid()  

  ### profiles
  SELECT: public (nanny), restricted (parent)  
  UPDATE: user_id = auth.uid()  

## 6. API Routes (Next.js)

  /api/auth/*
  /api/profile/*
  /api/ads/*
  /api/messages/*
  /api/conversations/*


## 7. Folder structure (MVP)
Do ustalenia

## 8. Development workflow
1. pnpm install  
2. supabase start  
3. pnpm dev  
4. Fast Refresh  
5. pnpm lint  
6. pnpm typecheck  
7. GitHub Actions → Preview Deploy  

## 9. Dev Containers
- Node 20
- pnpm
- Supabase CLI
- Postgres client
- VS Code extensions:
  - Tailwind
  - ESLint
  - Prettier
  - Supabase
  - Copilot

## 10. Wersje przyszłe (po MVP)
- płatności za wystawianie ogłoszeń,
- płatne pozycjonowanie,
- recenzje,
- kalendarz dostępności,
- rezerwacje,
- powiadomienia push,
- aplikacja mobilna.

## 11. Podsumowanie
FoxyCare w MVP = OLX dla niań:
ogłoszenia + filtrowanie + wiadomości + profile.
Brak płatności i rezerwacji.


## OPIS REPOZYTORIÓW

# REPO: foxycare-app
# (Aplikacja Next.js — frontend + API)

Zawartość:
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Logika ogłoszeń (CRUD)
- Logika filtrowania ogłoszeń
- Logika wiadomości (UI + API)
- Profile użytkowników (nanny/parent)
- API Routes:
  /api/ads
  /api/messages
  /api/conversations
  /api/profile
- Integracja z Supabase (auth, storage, realtime)
- Komponenty UI
- Layouty, routing, middleware
- Walidacja formularzy (zod)
- Konfiguracja środowiska (.env.local)
- Testy (opcjonalnie)
- Dev Container dla aplikacji (Node, pnpm, Supabase CLI)

Struktura:
foxycare-app/
  app/
  components/
  lib/
  styles/
  types/
  public/
  .devcontainer/
  package.json
  pnpm-lock.yaml

# REPO: foxycare-db
# (Baza danych Supabase — SQL, RLS, typy)

Zawartość:
- SQL migrations (schema + constraints)
- Tabele:
  users
  nanny_profiles
  parent_profiles
  ads
  ad_images
  conversations
  messages
- Indeksy
- Relacje (FK)
- RLS Policies (pełne bezpieczeństwo)
- Stored Procedures / RPC (opcjonalnie)
- Typy TypeScript generowane z Supabase:
  supabase-types.ts
- Seed data (opcjonalnie)
- Dev Container dla bazy (Postgres tools + Supabase CLI)
- README z instrukcją uruchomienia lokalnie

Struktura:
foxycare-db/
  migrations/
  seeds/
  types/
  .devcontainer/
  supabase/
    config.toml
    init.sql
  README.md
