import { defineConfig, devices } from '@playwright/test';

const serverCommand = 'node scripts/serve-dist.mjs --host 127.0.0.1 --port 4321';

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: serverCommand,
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: false,
    timeout: 120000
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } }
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] }
    }
  ]
});
