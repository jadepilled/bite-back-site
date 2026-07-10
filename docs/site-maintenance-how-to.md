# Bite Back Site Maintenance How-To

This site is a static Astro project deployed from `main` to GitHub Pages. Public content lives in JSON collections under `src/content`, and every build validates those files before publishing.

## 1. Creating a Campaign

1. Add a campaign JSON file in `src/content/campaigns`, using an existing file as the template.
2. Required campaign fields include `id`, `slug`, `title`, `status`, `issueType`, `affectedAnimals`, `jurisdiction`, `decisionMakers`, `desiredOutcome`, `measurableEndpoint`, `summary`, `problem`, `legalPathway`, `evidenceSummary`, `severity`, `primaryAction`, `images`, `sourceIds`, review statuses, confidence label, and `correctionHistory`.
3. Add source records in `src/content/sources` before referencing them from `sourceIds`.
4. Add campaign imagery in `public/images/campaigns` and register it in `src/content/images`.
5. Add progress entries in `src/content/progress` if the campaign already has milestones, then reference them from `progressIds`.
6. Keep Action Network URLs public only. Never commit API keys, supporter data, target CSVs, private legal notes, or MP boundary files.

Run:

```bash
npm run validate:content
npm run check
```

## 2. Creating a Friend Organisation

1. Add a JSON file in `src/content/friends`.
2. Use one of these `organisationType` values so filtering and colour labels work automatically:
   `political-organisation`, `advocacy-group`, `charity`, `outreach-group`, `animal-rescue`, `think-tank`.
3. Add `name`, `url`, `region`, `summary`, `description`, `alignment`, `websiteLabel`, `relationship`, and `tags`.
4. Add a local card image under `public/images/friends`, then reference it with:

```json
"image": {
  "src": "/images/friends/example.webp",
  "alt": "Short useful description of the card image."
}
```

The Friends page automatically adds the card, type chip, region chip, search result, and type filter.

## 3. Creating a Shop Item

1. Add a JSON file in `src/content/products`.
2. Required fields include `id`, `slug`, `name`, `category`, `status`, `priceAud`, `summary`, `description`, `colours`, `fundraisingReviewStatus`, and `fulfillmentStatus`.
3. Use `variants` for size, pack, colour, or bundle options.
4. Keep `checkoutUrl` empty until payment routing, fulfilment, returns, and fundraising-law review are ready.
5. Add product images under `images` when real product art or photos exist. Until then, the shop preview renders branded test graphics.

The route `/shop/[slug]/` is generated automatically from the JSON.

## 4. Editing Pages And JSON Data

Astro pages live in `src/pages`. Shared components live in `src/components`. Site-wide styling is in `src/styles/global.css`.

Use JSON collections for repeated public data:

- `src/content/campaigns` for campaign pages
- `src/content/friends` for friend cards
- `src/content/products` for shop items
- `src/content/news` for curated or automated news entries
- `src/content/news-sources` for automated feed inputs
- `src/content/platform-updates` for Track Record platform notes
- `src/content/progress` for campaign milestones
- `src/content/sources` for source register entries

After editing content, run:

```bash
npm run validate:content
```

After editing templates or styles, run:

```bash
npm run check
npm run build
```

## 5. Updating And Deploying Via GitHub

Use Node `22.12.0` or newer. This workspace can run checks with:

```bash
npm.cmd exec --package=node@22.12.0 -- node node_modules/astro/bin/astro.mjs check
npm.cmd exec --package=node@22.12.0 -- node node_modules/astro/bin/astro.mjs build
```

Refresh automated news before a release when needed:

```bash
npm run news:update
npm run validate:content
```

Run the browser suite before pushing:

```bash
npm run test:a11y
```

Deploy by committing to `main` and pushing:

```bash
git status -sb
git add -A
git commit -m "Describe the site change"
git push
```

GitHub Actions runs `.github/workflows/deploy.yml`, builds the static site, and publishes to GitHub Pages at `https://bitebackproject.au/`. Confirm the deployment by checking the workflow result and visiting the changed routes on the live domain.
