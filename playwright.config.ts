import { defineConfig, devices } from '@playwright/test';

const benchmarkUrl =
  'http://127.0.0.1:4173/revogrid-vs-bryntum-scheduling/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: benchmarkUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4173',
    url: benchmarkUrl,
    reuseExistingServer: !process.env.CI,
  },
});
