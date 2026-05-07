# VLESS Clash Builder

Next.js app for Vercel. It converts VLESS links into Clash/Mihomo YAML with bundled rule presets.

## Features

- `POST /api/convert`: convert VLESS input to Clash YAML without saving.
- `POST /api/links`: create a temporary in-memory short subscription link.
- `GET /s/{slug}`: return Clash YAML directly, suitable for Clash Verge import.
- `GET /api/clash`: stable personal subscription powered by `VLESS_CONFIG`.

## Important Storage Note

Temporary short links are stored in the current Vercel function instance memory.

They can disappear after:

- function cold start
- instance recycle
- redeploy
- traffic routed to another instance

This is intentional for the no-database MVP. For permanent user links, replace `lib/link-store.ts` with KV/database storage.

## Local Development

```bash
pnpm install
pnpm dev
```

## Vercel Environment Variables

Optional:

```text
VLESS_CONFIG=vless://...
VLESS_RULE_OPTIONS={"ads":true,"ai":true,"cn":true}
```

Then import this URL in Clash Verge:

```text
https://your-domain.vercel.app/api/clash
```

## Rule Options

Supported keys:

```text
ads, ai, youtube, google, github, microsoft, apple, social, streaming, games, cn, telegram, global
```

All options default to `true`.
