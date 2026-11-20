# Ultra Vestra — UGC Brand Intelligence Platform

> **Less time searching. More time creating. Smarter brand partnerships.**

Ultra Vestra helps creators find the brands worth pursuing for UGC work. For every
researched brand, Ultra Vestra shows what the brand does, the evidence that it works
with creators, the right public contact or creator application page, what
creators have actually reported earning, and a 0–100 **Opportunity Score**
with the reasons behind it — plus ready-to-use pitch templates and outreach
tracking. Creators pay a recurring subscription (Starter / Pro / Elite).

Two ideas sit at the center of the product:

- **Every worthwhile brand can be researched**, even if it is not running a
  campaign right now. Ultra Vestra separates "worth pitching" from "verified open
  opportunity."
- **Trust is the product.** Every fact carries its source, the date it was
  collected, the date it was last checked, and a verification status
  (`verified`, `publicly_reported`, `needs_review`, `expired`). No made-up
  payment rates, no dead emails.

The website and the future mobile app share **one backend** (Supabase), so
creator profiles, saved brands, subscriptions and research stay in sync.

## Stack

- **Next.js** (App Router, TypeScript) — website (mobile app later, same API)
- **Supabase** — PostgreSQL, Auth, Row Level Security, storage
- **Stripe** — recurring subscriptions (wired in Phase 4; keys are
  placeholders until then)
- **Vercel** — hosting

## Project layout

```
app/                  Next.js App Router pages
  page.tsx            Landing page
  brands/page.tsx     Brand directory (search + category filter)
  brands/[id]/        Brand profile (contacts, pay, score, evidence)
  saved/page.tsx      Creator's saved brands
  pricing/page.tsx    Starter / Pro / Elite (from the plans table)
  login/page.tsx      Supabase magic-link sign-in (placeholder onboarding)
components/           BrandCard, SaveBrandButton
lib/supabase/         Browser + server Supabase clients (@supabase/ssr)
lib/types.ts          Types mirroring the schema
supabase/schema.sql   The complete database schema (run once, see below)
```

## Setup

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the whole of `supabase/schema.sql`, and run it.
   It creates all tables, indexes, `updated_at` triggers, Row Level Security
   policies, and seeds the plans (Starter $19, Pro $39, Elite $79) and the
   12 launch categories.
3. In **Authentication → Providers**, keep Email enabled (magic link is used
   by `/login`).
4. Make yourself an admin: sign up once through the app, then run
   `insert into public.admin_users (user_id, role) values ('<your-auth-user-id>', 'owner');`
   in the SQL Editor. Admins (and the service role, used by research jobs)
   are the only writers of brand research data.

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in, from
**Supabase → Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server only — never expose to the browser
```

Stripe keys stay as placeholders until Phase 4.

### 3. Run locally

```bash
npm install
npm run dev
# http://localhost:3000
```

Brand data is protected by RLS: the directory shows published brands to
signed-in users. Add brands directly in Supabase (set `status = 'published'`)
or through the future admin tools, and they appear in the app immediately.

### 4. Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the same environment variables in **Project Settings → Environment
   Variables**.
3. Deploy. Every push to the production branch redeploys automatically.

## The Opportunity Score

Stored in `brand_scores`, always shown with its explanation:

| Component | Points |
| --- | --- |
| Creator niche & content fit | 30 |
| Evidence of UGC collaborations | 20 |
| Compensation attractiveness | 20 |
| Contact accessibility | 15 |
| Opportunity availability | 10 |
| Brand credibility | 5 |
| **Total** | **100** |

## Research freshness

Backend research jobs (tracked in `research_jobs` / `research_logs`) follow
this cadence: discover new brands and refresh opportunities **daily**;
check broken links **weekly**; recheck contacts and affiliate programs
**every 30 days**; review compensation reports **on submission and
monthly**; recalculate scores **when material information changes**.

## Roadmap

- **Phase 1 — Database & brand intelligence (this milestone).** Supabase
  schema, security, research ingestion, admin. Launch targets: 500
  researched brands, 10–12 categories, a source record on 100% of published
  profiles. 300 excellent profiles beat 5,000 unreliable ones.
- **Phase 2 — Website & mobile experience.** Creator onboarding (niche &
  interest questionnaire), directory, search, brand profiles, saved brands.
- **Phase 3 — AI research & matching.** Automated brand research, scoring,
  personalized recommendations (`creator_matches`), compensation insights,
  pitch generation.
- **Phase 4 — Subscriptions & launch.** Stripe Checkout + verified webhooks
  updating `subscriptions` (paid features unlock server-side only, never
  from a browser redirect), plan-based permissions, analytics, testing,
  launch with 25–50 creator test users.

## Security rules (non-negotiable)

- RLS is enabled on every table. Creators can only touch their own rows.
- Brand research writes are service-role/admin only.
- The service-role key and Stripe secret keys never reach the browser.
- Pitches are drafts the creator reviews and sends; any future automated
  email must include unsubscribe handling and CAN-SPAM compliance.
