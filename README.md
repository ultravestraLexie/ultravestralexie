# Ultra Vestra — Brand Intelligence Platform

> **Search smarter. Find better brands. Create content that sells.**
> Less time searching. More time creating. Smarter brand partnerships.

Ultra Vestra helps creators find the brands worth pursuing for creator work. For every
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
  page.tsx            Landing page — search-first hero into Discover
  discover/page.tsx   Universal search: database + live web, with filters
  ask/page.tsx        Ask UltraVestra — structured research reports
  brands/page.tsx     Brand directory (search + category filter)
  brands/[id]/        Brand profile (contacts, pay, score, evidence)
  opportunities/      Opportunity Finder (apply now / worth pitching)
  academy/page.tsx    Creator Academy — searchable lessons
  coach/page.tsx      Video Coach (coming soon, honestly labeled)
  saved/page.tsx      Creator's saved brands
  pricing/page.tsx    Starter / Pro / Elite (from the plans table)
  login/page.tsx      Supabase sign-in
  api/suggest/        Live search suggestions for the Ask search box
components/           BrandCard, SaveBrandButton, AskSearchBox, AcademySearch
lib/supabase/         Browser + server Supabase clients (@supabase/ssr)
lib/types.ts          Types mirroring the schema
lib/search.ts         Search engine: tokenize, synonyms, intent, relevance
lib/websearch.ts      Live-web provider adapter (normalized results)
lib/academy.ts        Creator Academy lesson library
supabase/schema.sql   The complete database schema (run once, see below)
```

## The five experiences

| Experience | Route | What it does |
| --- | --- | --- |
| Discover | `/discover` | Universal search across the verified database **and** the live public web; filters: niche, platform, uncapped, smaller-creator evidence, accepting applications |
| Brand Intelligence | `/brands`, `/brands/[id]` | Sourced brand profiles: score with reasons, commissions, contacts, evidence with source URLs and check dates |
| Opportunity Finder | `/opportunities` | Brands accepting applications now + high-score brands worth pitching without an advertised campaign |
| Creator Academy | `/academy` | Searchable lessons: hooks, scripts, filming, pitching, pricing, growth |
| Ask UltraVestra | `/ask` | One question → structured report: best-fit brands, commission evidence, application links, pitch-worthy brands, contacts + ready-to-use pitch, three video concepts, script + filming blueprint, why it works |
| Video Coach | `/coach` | Coming soon. The scoring checklist is published there; uploads open only when secure storage and a real analysis pipeline exist |

## Search architecture

Two engines, always labeled separately:

1. **UltraVestra database** — `lib/search.ts` tokenizes the question, expands
   synonyms, extracts intent (uncapped, smaller creators, platform, minimum
   published rate) and scores every published brand by relevance across name,
   categories, network, country and description. Ranking: intent filters →
   relevance → Opportunity Score. Every result explains why it matched.
2. **Live web** — `lib/websearch.ts` is a provider adapter returning
   normalized results (title, URL, snippet, domain). The current adapter is
   keyless (DuckDuckGo Lite). To use Tavily or Brave, implement the same
   `webSearch(query, max)` signature and add the key as a server-only env var.
   Web results are always labeled **unverified** — no rate or term from the
   web is ever presented as a verified fact.

Data integrity rules (non-negotiable):

- "Uncapped" appears only when a fetched source explicitly states no
  earnings cap. Silence renders as "Ceiling: not stated", never as uncapped.
- Low creator competition is shown only with absolute-count evidence;
  otherwise "Creator competition: insufficient data".
- Contacts are public business contacts from sources — never guessed.
- Compensation comes only from published sources; unpublished = "Not published".

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
STRIPE_SECRET_KEY=...           # server only
STRIPE_WEBHOOK_SECRET=...       # verifies webhook signatures
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
# Optional upgrades (server only):
TAVILY_API_KEY=...              # swap the web-search adapter to Tavily
BRAVE_SEARCH_API_KEY=...        # …or to Brave Search
OPENAI_API_KEY=...              # future LLM report synthesis (reports are
                                # currently generated deterministically
                                # from the database)
```

Stripe subscriptions unlock only via the verified webhook
(`app/api/stripe/webhook`), never on a browser redirect. Stripe is currently
in sandbox/test mode until the owner activates the account with business and
bank details.

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
| Evidence of creator collaborations | 20 |
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

## Build kit note and known limitations

The AI build kit's starter migration (`001_ultravestra_core.sql`) was **not**
applied: the live schema in `supabase/schema.sql` already implements that
model more completely (33 tables), and the starter migration redefines core
tables (e.g. `brands`) incompatibly. The kit's product requirements were
implemented in the app layer instead.

Known limitations:

- Live web results depend on the keyless adapter's availability; a paid
  provider key (Tavily/Brave) is the upgrade path.
- Ask reports are deterministic database reports, not LLM prose; an LLM
  synthesis layer can be added behind `OPENAI_API_KEY`.
- Video Coach analysis is not yet connected (see `/coach`).

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

Deployment: the five-experience search platform (Discover, Brand Intelligence, Opportunities, Creator Academy, Video Coach) shipped 2026-11-20.

## The vision — the intelligence layer (owner's positioning, 2026-11-20)

UltraVestra does not compete with TikTok, Amazon, eBay, Instagram or Trybe.
It is the intelligence platform that helps creators succeed on all five.

- TikTok helps creators sell. Amazon helps creators monetize. eBay helps
  creators refer buyers. Instagram helps creators collaborate. Trybe helps
  creators work with brands.
- **UltraVestra helps creators figure out where to go, what to promote,
  what they could earn, and how to create content that converts.**

## Intelligence centers (added 2026-11-20)

- **Commission Intelligence Center** (`/commissions`) — every researched
  program separated into verified uncapped, stated cap, and unknown limit;
  published rates compared with the terms on record (cookie, payout,
  recurring) quoted from sourced evidence. A rate is never shown unless
  the brand publishes it.
- **Creator Video Intelligence Lab** (`/coach`) — a working diagnostic
  across the five performance areas (hook, demonstration, storytelling,
  retention, sales conversion): scores the creator's own video, explains
  why each weak area costs views and sales, and turns it into fixes plus
  Academy lessons. Upload-based analysis stays honestly "coming" until
  storage and an analysis provider are configured.
- **Brand Opportunity Radar** (`/radar`) — four live lanes: accepting
  creators now, worth pitching (score 70+, no advertised campaign),
  emerging (newest researched), and under the radar (verified uncapped or
  smaller-creator friendly, no open campaign).
