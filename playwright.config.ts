import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  reporter: [['html', { open: 'never' }], ['json']], // never auto-open report
  globalSetup: './playwright/global-setup.ts',
  use: {
    baseURL: 'http://localhost:4174',
    screenshot: 'on',
    trace: 'on',
    viewport: { width: 1280, height: 720 },
  },

  webServer: {
    command: 'pnpm --dir ../../ run preview',
    port: 4174,
    reuseExistingServer: true,
  },
});
