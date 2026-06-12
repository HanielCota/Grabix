import { defineConfig, devices } from "@playwright/test";

// E2E config for Grabix. Tests target only PUBLIC (signed-out) pages so they run
// without a database or Google OAuth, staying fast and deterministic. We assert
// behaviour + accessibility (axe-core) rather than pixel screenshots, which are
// flaky across OSes (local Windows vs Linux CI).

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    testIdAttribute: "data-testid",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
