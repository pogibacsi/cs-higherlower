# CS2 Higher / Lower

Embeddable iframe-only CS2 price guessing game built with Next.js, TypeScript,
Tailwind, Drizzle, Cloudflare Workers, and Cloudflare D1.

## Cloudflare Setup

Install dependencies:

```bash
npm install
```

Create the D1 database:

```bash
npx wrangler d1 create cs-higherlower
```

Copy the returned `database_id` into `wrangler.jsonc`, replacing
`REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID`, or run:

```bash
npm run cf:set-d1 -- DATABASE_ID_FROM_WRANGLER
```

Check that the deployment config is no longer using placeholders:

```bash
npm run cf:preflight
```

Generate and apply migrations:

```bash
npm run db:generate
npm run db:migrate:local
npm run db:migrate:remote
```

Seed local or remote D1:

```bash
npm run db:seed:local
npm run db:seed:remote
```

Set production secrets. Admin routes use HTTP Basic Auth; any username is
accepted, and `ADMIN_PASSWORD` is the password.

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put PRICE_SYNC_CRON_SECRET
```

Preview and deploy on Cloudflare Workers:

```bash
npm run preview
npm run deploy
```

The deploy scripts pass `--keep-vars` through to Wrangler so runtime variables
or secrets configured in the Cloudflare dashboard are not removed during deploy.

With `npm run preview` running in another terminal, smoke-test the Cloudflare
runtime:

```bash
npm run smoke:cf
npm run price-sync:mock
```

Useful routes:

- `/play`
- `/embed/demo`
- `/admin/partners`
- `/admin/items`
- `/admin/leaderboards`
- `/admin/price-sync`

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

Gameplay reads stored D1 prices only. The Cloudflare Cron Trigger in
`wrangler.jsonc` runs every 30 minutes and updates a cursor-based batch so the
Worker stays inside free-tier subrequest limits.

For local cron testing:

```bash
npm run preview
curl "http://localhost:8787/__scheduled?cron=*/30+*+*+*+*"
```

Manual admin runs are available from `/admin/price-sync`. The Steam Community
Market provider is isolated behind `PriceProvider` in `src/lib/price-sync`, so
it can be replaced by a paid provider later.
