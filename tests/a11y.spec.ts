import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  '/',
  '/campaigns/',
  '/campaigns/sentience-in-statute-teeth-in-practice/',
  '/campaigns/open-animal-welfare-data/',
  '/take-action/',
  '/mission/',
  '/track-record/',
  '/news/',
  '/friends/',
  '/shop/'
];

for (const route of routes) {
  test(`accessibility scan: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
