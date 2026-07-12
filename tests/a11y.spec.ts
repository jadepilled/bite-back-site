import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = [
  '/',
  '/campaigns/',
  '/campaigns/1080-to-zero/',
  '/about/',
  '/news/',
  '/friends/',
  '/shop/',
  '/shop/laws-with-teeth-bumper-sticker/'
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
