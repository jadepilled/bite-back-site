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
  await expect(firstCampaign).toContainText('High severity');
});

test('mobile campaign sticky action does not cover footer content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/campaigns/open-animal-welfare-data/');
  const sticky = page.locator('.sticky-action');
  await expect(sticky).toBeVisible();
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
  await expect(page.getByRole('contentinfo')).toBeVisible();
});
