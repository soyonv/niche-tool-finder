# ScrubKit

A privacy-first browser toolkit for cleaning and transforming messy text/data.

> No upload. No signup. No limits. Clean your data instantly in your browser.

Static Astro site: one fully working tool per URL, every transformation runs
client-side (Web Worker for large inputs), no backend, no database, no
analytics.

## Stack

- **Astro** (static output → `./dist`)
- **TypeScript** + pure transform functions in `src/lib/`
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Web Worker** (`src/workers/processor.worker.ts`) for inputs > 100 KB
- **Cloudflare Workers Static Assets** hosting (assets-only, no Worker script)

## Commands

```bash
bun install        # install dependencies
bun run dev        # dev server on 0.0.0.0:4321
bun run build      # static build → dist/
bun run check      # astro check (type checking)
bun test           # unit tests for all 10 transforms
bun run preview    # serve the built site locally with wrangler dev
```

## Deploy to Cloudflare (workers.dev, free)

Configuration lives in `wrangler.jsonc` (assets directory `./dist`,
`not_found_handling: 404-page`, no `main` script, no bindings).

```bash
npx wrangler login        # one-time interactive auth
npm run build             # astro build → dist/
npx wrangler deploy       # → https://scrubkit.<account>.workers.dev
```

Non-interactive/CI instead of `wrangler login`: set `CLOUDFLARE_API_TOKEN`
and `CLOUDFLARE_ACCOUNT_ID`.

One-time dashboard step: enable your account's `workers.dev` subdomain.

### After the first deploy

Update the canonical origin in two places:

1. `astro.config.mjs` → `site: 'https://<name>.<account>.workers.dev'`
2. `public/robots.txt` → sitemap URL

## Structure

```
src/lib/            pure transform functions (one module per tool)
src/lib/registry.ts tool definitions: copy, options, FAQ, run()
src/workers/        Web Worker that runs transforms off the main thread
src/scripts/        tool-shell (per-tool UI runner), home-demo
src/components/     ToolShell, ToolCard, Breadcrumb
src/pages/          /, /tools/, /tools/{slug}/, /categories/, /use-cases/,
                    /guides/, /privacy/, /about/, /404
```

## Privacy model

No accounts, no cookies, no third-party requests, no server-side processing.
localStorage stores only tool option preferences — never pasted content.
