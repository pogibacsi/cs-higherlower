# CS2 Higher/Lower Web App Specification

## Concept

Build a production-ready embeddable web app for CS2 websites, marketplaces, and blogs. The app is a "Higher or Lower" game using CS2 Steam Community Market EUR prices.

Users see two CS2 items. One item's EUR price is visible. The user guesses whether the second item is higher or lower in price. After the answer, reveal the second price, show correct/incorrect status, update score, and continue until the user loses.

## Embed Approach

The MVP must use iframe embedding only.

Do not build a JavaScript embed for v1.

Main embed route:

/embed/[partnerSlug]

Each partner gets a copy-paste iframe snippet:

<iframe
  src="https://APP_DOMAIN/embed/PARTNER_SLUG"
  width="100%"
  height="650"
  style="border:0; border-radius:12px; overflow:hidden;"
  loading="lazy"
></iframe>

The iframe must be self-contained. Partner websites should not need extra CSS or JavaScript.

Add optional postMessage-based auto-resize support so the iframe can notify the parent page of its ideal height. The iframe must not assume access to the parent DOM.

Because third-party iframe cookies may be blocked, gameplay/session tracking should work with local/session identifiers where possible.

## Game Modes

### Daily Challenge

One shared daily challenge per day.

Requirements:
- Same ordered item sequence for all users on that date.
- Users can submit nickname/display name.
- Daily leaderboard resets per day.
- Track score, correct answers, timestamp, and partner source.
- No login required for MVP.
- Use Europe/Brussels timezone by default.
- Generate deterministic daily sequence from date seed.
- Store daily challenge date, seed, and item sequence.

### Classic Mode

Users can play anytime.

Requirements:
- Randomized item sequence.
- Score stored locally and optionally submitted to all-time leaderboard.
- Classic leaderboard can be global and partner-specific.
- Include best score persistence per browser.

## Target Items

Include only:
- CS2 cases/crates
- Knives
- Gloves
- Red rarity / Covert weapon skins

Exclude:
- Agents
- Blue, purple, and pink lower-rarity skins
- Stickers
- Music kits
- Graffiti
- Patches
- Keys
- Misc items
- Souvenir packages unless later categorized as cases

## Data Source and Price Sync

Fetch prices from Steam Community Market in EUR for CS2 appid 730.

Do not fetch live prices during gameplay.

Run scheduled nightly/evening batch sync:
- Conservative batching
- Delay between requests
- Retry with exponential backoff
- Respect rate limits / 429 responses
- Store fetch status
- Keep old price if fetch fails
- Mark failed items as stale
- Do not break gameplay due to stale/missing prices

Design fetching behind a service abstraction so it can later be replaced by a paid provider.

Store:
- market_hash_name
- display name
- image URL
- category
- rarity
- exterior where applicable
- StatTrak/Souvenir flags where applicable
- current EUR price
- last successful fetch timestamp
- fetch status

## Legal and Compliance

Add footer disclaimer:

"Not affiliated with or endorsed by Valve or Steam. Prices are approximate and may be delayed."

Do not use Steam/Valve branding as if official.

The app must not include:
- gambling
- betting
- skin wagering
- deposits
- withdrawals
- paid chance mechanics

It is a free guessing game only.

## Suggested Stack

Use:
- Next.js 15+ App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase/PostgreSQL
- Prisma or Drizzle ORM
- Zod validation
- Server-side API routes
- Scheduled worker/cron for price sync
- Optional Redis/Upstash or Supabase-compatible rate limiting

## Core Routes

Frontend:
- /embed/[partnerSlug]
- /play
- /admin/partners
- /admin/items
- /admin/leaderboards
- /admin/price-sync

API:
- GET /api/embed-config/:partnerSlug
- GET /api/game/start?mode=daily|classic&partnerSlug=...
- POST /api/game/answer
- POST /api/scores/submit
- GET /api/leaderboard?mode=daily|classic&date=YYYY-MM-DD&partnerSlug=...
- POST /api/admin/partners
- PATCH /api/admin/partners/:id
- POST /api/admin/price-sync/run
- GET /api/admin/price-sync/runs
- GET /api/admin/items

## Partner Customization

Partners should have:
- name
- slug
- logo URL
- primary color
- secondary color
- background color
- text color
- border radius style
- CTA label
- CTA URL
- allowed embed domains
- enabled/disabled status

The embed route should load theme and leaderboard context by partnerSlug.

Use CSS variables:
- --partner-primary
- --partner-secondary
- --partner-bg
- --partner-text

## Gameplay Rules

Each round:
- Left card shows item name, image, and visible price.
- Right card shows item name, image, and hidden price.
- Buttons: Higher / Lower.
- Keyboard support: H = Higher, L = Lower.

After answer:
- Reveal right item price.
- Show correct/incorrect state.
- If correct, increment score and continue.
- If incorrect, game over and show leaderboard submission.

Avoid:
- Same item repeated in one run.
- Price pairs that are equal or too close.
- Use minimum price difference threshold around 3-5%.

UI should be fast, responsive, mobile-friendly, and not casino-like.

## Database Schema

### items

- id
- market_hash_name unique
- display_name
- category enum: case, knife, glove, covert_skin
- rarity nullable
- weapon_name nullable
- exterior nullable
- is_stattrak boolean
- is_souvenir boolean
- image_url
- steam_market_url
- active boolean
- created_at
- updated_at

### item_prices

- id
- item_id
- currency default EUR
- price_eur numeric
- volume nullable
- source default steam_market
- fetched_at
- status enum: success, failed, stale
- raw_response jsonb nullable

### current_item_prices

- item_id primary key
- price_eur numeric
- currency
- last_successful_fetch_at
- status
- updated_at

### price_fetch_runs

- id
- started_at
- finished_at
- status
- total_items
- success_count
- fail_count
- error_summary jsonb

### partners

- id
- name
- slug unique
- logo_url nullable
- primary_color
- secondary_color
- background_color
- text_color
- border_radius
- cta_label nullable
- cta_url nullable
- allowed_domains text[]
- enabled boolean
- created_at
- updated_at

### daily_challenges

- id
- challenge_date unique
- timezone
- seed
- item_sequence jsonb
- created_at

### scores

- id
- mode enum: daily, classic
- challenge_date nullable
- partner_id nullable
- nickname
- score integer
- rounds_played integer
- anonymous_user_id
- session_id
- user_agent_hash nullable
- created_at

### game_sessions

- id
- mode
- partner_id nullable
- challenge_date nullable
- anonymous_user_id
- current_score
- current_round
- item_sequence jsonb
- completed boolean
- created_at
- updated_at

## Seed Data

Create seed script with at least:
- 20 cases
- 30 knives
- 20 gloves
- 50 covert/red skins

Use real market_hash_name values where possible. Placeholder images are acceptable for MVP, but schema/UI must support real images.

## Price Sync Requirements

Implement a worker/service that fetches Steam Community Market price overview data with:
- appid=730
- currency set to EUR
- URL-encoded market_hash_name

The worker should:
- Process items in batches
- Delay between requests
- Retry failed requests with exponential backoff
- Respect 429/rate-limit responses
- Log fetch status per item
- Never delete old prices automatically
- Update current_item_prices only on successful fetch

Environment variables:
- DATABASE_URL
- NEXT_PUBLIC_APP_URL
- ADMIN_PASSWORD
- PRICE_SYNC_BATCH_SIZE
- PRICE_SYNC_DELAY_MS
- PRICE_SYNC_CRON_SECRET
- DEFAULT_TIMEZONE=Europe/Brussels

## Security and Abuse Prevention

- Validate all API inputs with Zod.
- Rate limit game starts and score submissions.
- Sanitize nicknames.
- Do not blindly trust client-submitted scores.
- For Daily Challenge, verify score server-side where possible.
- Check partner slug validity.
- If allowed_domains exists, check Referer/Origin where available, but do not treat it as perfect security.

## Admin Dashboard

Simple protected admin area using env password or basic auth for MVP.

Admin features:
- Manage partners.
- Generate iframe snippets.
- View items and prices.
- View stale/failed price fetches.
- Trigger manual price sync.
- View price sync runs.
- View leaderboards.

## Analytics

Track privacy-friendly events:
- game_started
- answer_submitted
- game_over
- score_submitted
- partner_embed_loaded

Store:
- partner_id
- mode
- timestamp

Avoid invasive tracking.

## Implementation Priorities

Implement in this order:
1. App scaffold
2. Database schema/migrations
3. Seed data
4. Partner config
5. Iframe embed route
6. Game logic
7. Daily challenge
8. Classic mode
9. Leaderboards
10. Mock price sync
11. Admin dashboard
12. Real Steam price sync abstraction

## Quality Bar

Code should be clean, modular, and production-oriented.

Avoid throwaway prototype code.

Make it easy to later add:
- paid data provider
- authentication
- stricter anti-cheat
- partner analytics
- premium customization
- more CS2 item categories