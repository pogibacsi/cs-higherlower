# CS2 Higher / Lower

Embeddable iframe-only CS2 price guessing game built with Next.js, TypeScript, Tailwind, Drizzle, and Supabase-compatible PostgreSQL.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to a Supabase/PostgreSQL connection string.
3. For local development without Supabase, start Postgres:

```bash
npm run db:local:up
```

Use this local URL:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cs_higherlower"
```

4. Run migrations:

```bash
npm run db:migrate
```

5. Seed the demo partner and MVP item set:

```bash
npm run db:seed
```

6. Run the DB-backed smoke test:

```bash
npm run smoke:db
```

7. Start the app:

```bash
npm run dev
```

Demo routes:

- `/play`
- `/embed/demo`
- `/admin/partners`
- `/admin/items`
- `/admin/leaderboards`
- `/admin/price-sync`

Admin routes are protected with HTTP Basic Auth. Use any username and `ADMIN_PASSWORD` as the password.

## Embed

Partners use iframe embeds only:

```html
<iframe
  src="https://APP_DOMAIN/embed/PARTNER_SLUG"
  width="100%"
  height="650"
  style="border:0; border-radius:12px; overflow:hidden;"
  loading="lazy"
></iframe>
```

The iframe posts resize messages to the parent:

```ts
window.addEventListener("message", (event) => {
  if (event.data?.type === "cs2-higherlower:resize") {
    iframe.style.height = `${event.data.height}px`;
  }
});
```

## Price Sync

Gameplay reads stored prices only. Use the mock provider for local MVP testing:

```bash
npm run price-sync:mock
```

The Steam Community Market provider is isolated behind `PriceProvider` in `src/lib/price-sync`, so it can be replaced by a paid provider later.

For scheduled production syncs, call:

```bash
POST /api/cron/price-sync
x-cron-secret: PRICE_SYNC_CRON_SECRET
```
