import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./tests/results",
  fullyParallel: true,
  retries: 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "https://negev.sb0.tech",
    screenshot: "on",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"] },
    },
    {
      name: "tablet",
      use: { ...devices["iPad (gen 7)"] },
    },
  ],
});
