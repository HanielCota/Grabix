import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Public, signed-out pages only — no DB/OAuth required, so these are fast and
// deterministic. Functional + accessibility checks (no flaky screenshot diffs).

test.describe("landing (signed out)", () => {
  test("shows the hero and the Google sign-in CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "GRABIX" })).toBeVisible();
    await expect(page.getByRole("button", { name: /continuar com google/i })).toBeVisible();
    // Free-plan limits are communicated up front.
    await expect(page.getByText(/itens por análise/i)).toBeVisible();
  });

  test("has no serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/");
    // Wait for the client session to resolve and render the signed-out card.
    await page.getByRole("button", { name: /continuar com google/i }).waitFor();

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");

    expect(blocking.map((v) => `${v.id} (${v.impact})`)).toEqual([]);
  });
});

test.describe("sign-in page", () => {
  test("renders and exposes the sign-in action", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /entre no grabix/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continuar com google/i })).toBeVisible();
  });
});
