# Bite Back

Static Astro site for Bite Back, built from the launch dossier as a public action platform for GitHub Pages.

## Requirements

- Node.js `>=22.12.0`
- npm `>=9.6.5`

The local machine currently has Node `22.11.0`, so verification in this workspace used `node@22.12.0` through `npm exec`.

## Commands

```bash
npm install
npm run process:logo
npm run news:update
npm run validate:content
npm run check
npm run build
npm run test
```

For local static preview after a build:

```bash
node scripts/serve-dist.mjs --host 127.0.0.1 --port 4321
```

## Content Model

Campaigns are JSON files in `src/content/campaigns`. They reference structured sources, images, news/background entries and progress updates. Shop products, friend listings, platform updates and news sources are also JSON-backed collections in `src/content/products`, `src/content/friends`, `src/content/platform-updates` and `src/content/news-sources`.

For day-to-day editing, see `docs/site-maintenance-how-to.md`.

Astro validates collection shapes at build time, and `scripts/validate-content.mjs` checks cross-references plus launch-specific guardrails.

`scripts/process-logo.mjs` uses `bite_back_logo.png` to generate the favicon set and reusable black, white and transparent pixel-art bite-mark assets under `public/brand`.

`scripts/update-news.mjs` refreshes automated news entries from allowlisted Australian sources, scores them for relevance, suppresses weak or duplicate items, writes JSON to `src/content/news`, and caches available article images under `public/images/news`. The scheduled workflow in `.github/workflows/update-news.yml` runs the updater every six hours and commits changed news files.

No supporter data, Action Network credentials, MP target files, private legal notes or payment data belong in this repository.

## Deployment

The GitHub Pages workflow is in `.github/workflows/deploy.yml` and builds from `main` with Node `22.12.0`. The custom domain is configured through `CNAME` as `bitebackproject.au`.

Action Network actions are currently behind a testing gate. Public MP-contact delivery should not be enabled until Australian representative targeting, message delivery, consent, unsubscribe and action export logs pass testing.
