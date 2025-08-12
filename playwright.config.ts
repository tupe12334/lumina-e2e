import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  reporter: "html",
  globalSetup: "./playwright/global-setup.ts",
  use: {
    baseURL: "http://localhost:4173",
    screenshot: "on",
    trace: "on",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "pnpm --dir ../client preview",
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
