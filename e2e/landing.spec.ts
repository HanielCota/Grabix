import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Public, signed-out pages only - no DB/OAuth required, so these are fast and
// deterministic. Functional + accessibility checks (no flaky screenshot diffs).

test.describe("landing (signed out)", () => {
  test("shows the hero and the Google sign-in CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "GRABIX", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /continuar com google/i })).toBeVisible();
    // Free-plan limits are communicated up front (unique to the signed-out card).
    await expect(page.getByText(/20 downloads por dia/i)).toBeVisible();
  });

  test("surfaces the Pro plan contents up front (no modal needed)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /o que vem no grabix pro/i })).toBeVisible();
    // Key Pro benefits are listed directly in the upsell block (the same labels
    // also appear in the comparison table and FAQ further down, so scope here).
    const proUpsell = page.getByRole("region", { name: /o que vem no grabix pro/i });
    await expect(proUpsell.getByText(/downloads diários ilimitados/i)).toBeVisible();
    await expect(proUpsell.getByText(/busca profunda/i)).toBeVisible();
  });

  test("has no serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ reducedMotion: "reduce" });
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
