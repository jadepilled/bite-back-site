import { test, expect } from '@playwright/test';

test('home page has dossier-aligned action platform content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Giving animal welfare laws teeth.' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Take action/i }).first()).toBeVisible();
  await expect(page.getByText('Sources open. Targets named. Outcomes tracked.')).toBeVisible();
  await expect(page.locator('a[href="/news/"]').first()).toBeAttached();
});

test('campaign pages expose evidence, decision-makers, and action status', async ({ page }) => {
  await page.goto('/campaigns/sentience-in-statute-teeth-in-practice/');
  await expect(page.getByRole('heading', { name: 'Sentience in Statute, Teeth in Practice' })).toBeVisible();
  await expect(page.getByText('Decision-maker')).toBeVisible();
  await expect(page.getByLabel('Campaign facts').getByText('Severity', { exact: true })).toBeVisible();
  await expect(page.getByText('Testing gate').first()).toBeVisible();
  await expect(page.getByText('Sources')).toBeVisible();
});

test('campaign index can sort by severity', async ({ page }) => {
  await page.goto('/campaigns/');
  await expect(page.getByLabel('Sort campaigns')).toBeVisible();
  await page.getByLabel('Sort campaigns').selectOption('severity-desc');
  const firstCampaign = page.locator('[data-campaign-card]').first();
  await expect(firstCampaign).toContainText('Extreme severity');
  await expect(firstCampaign).toContainText('1080 to Zero');
});

test('1080 to Zero campaign exposes AAWS pathway and phase-out ask', async ({ page }) => {
  await page.goto('/campaigns/1080-to-zero/');
  await expect(page.getByRole('heading', { name: '1080 to Zero', exact: true })).toBeVisible();
  await expect(page.getByText('31 December 2030').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Animal Welfare Task Group members/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tell ministers: 1080 to Zero' })).toBeVisible();
  await expect(page.getByRole('link', { name: /RSPCA/i })).toBeVisible();
});

test('mobile campaign sticky action does not cover footer content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/campaigns/open-animal-welfare-data/');
  const sticky = page.locator('.sticky-action');
  await expect(sticky).toBeVisible();
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
  await expect(page.getByRole('contentinfo')).toBeVisible();
});

test('shop supports catalogue filtering and product detail pages', async ({ page }) => {
  await page.goto('/shop/');
  await expect(page.getByLabel('Shop readiness')).toContainText('Products in the test catalogue');
  await page.getByLabel('Category').selectOption('bumper-sticker');
  await page.getByLabel('Sort').selectOption('price-desc');

  const visibleCards = page.locator('[data-product-card]:visible');
  await expect(visibleCards.first()).toContainText('AUD');
  await expect(page.getByRole('link', { name: 'Inspect item' }).first()).toBeVisible();

  await page.goto('/shop/laws-with-teeth-bumper-sticker/');
  await expect(page.getByRole('heading', { name: 'Laws With Teeth' })).toBeVisible();
  await expect(page.getByLabel('Variants')).toContainText('Three-pack');
  await expect(page.getByText('Fundraising review')).toBeVisible();
});

test('news feed exposes source quality controls', async ({ page }) => {
  await page.goto('/news/');
  await expect(page.getByLabel('News feed summary')).toContainText('Fresh source-watch items');
  await page.getByLabel('Feed type').selectOption('automated');
  await page.getByLabel('Sort').selectOption('score-desc');

  const firstStory = page.locator('[data-news-card]:visible').first();
  await expect(firstStory).toContainText(/Score|source watch/);

  await page.getByLabel('Source').selectOption('ABC News');
  await expect(page.locator('[data-news-card]:visible').first()).toContainText('ABC News');
  await expect(page.locator('[data-news-card]:visible').first()).toContainText(/\d+(st|nd|rd|th) [A-Z][a-z]{2}\. 2026/);
  await expect(page.getByText('Sources are selected for reliability')).toBeVisible();
});

test('friends directory supports search and type filtering', async ({ page }) => {
  await page.goto('/friends/');
  await expect(page.getByLabel('Friend directory filters')).toBeVisible();
  await expect(page.getByRole('link', { name: /animaljusticeparty\.org/i })).toBeVisible();
  const justiceCard = page.locator('[data-friend-card]').filter({ hasText: 'Animal Justice Party' });
  await expect(justiceCard.getByText('Political organisation')).toBeVisible();
  await expect(justiceCard.locator('.label-chip--region', { hasText: 'Australia' })).toBeVisible();

  await page.getByLabel('Search by name').fill('liberation');
  await expect(page.locator('[data-friend-card]:visible')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Animal Liberation' })).toBeVisible();

  await page.getByLabel('Advocacy group').uncheck({ force: true });
  await expect(page.locator('[data-friend-card]:visible')).toHaveCount(0);
});

test('track record shows readiness, platform updates, and correction history', async ({ page }) => {
  await page.goto('/track-record/');
  await expect(page.getByText('Public campaigns')).toBeVisible();
  await expect(page.getByText('Campaign readiness')).toBeVisible();
  await expect(page.getByText('Review queue')).toBeVisible();
  await expect(page.getByText('Platform updates', { exact: true })).toBeVisible();
  await expect(page.getByText('Correction ledger')).toBeVisible();
});
