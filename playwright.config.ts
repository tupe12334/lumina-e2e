import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright",
  reporter: "html",
  use: {
    baseURL: "http://localhost:5766",
    screenshot: "on",
    trace: "on",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "pnpm --dir ../client preview",
    port: 5766,
    reuseExistingServer: !process.env.CI,
  },
});
