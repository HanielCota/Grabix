import assert from "node:assert/strict";
import test from "node:test";
import { getComparisonCategories, getPlanPresentations } from "@/lib/plans/presentation";
import { PLANS } from "@/server/plans";

test("customer-facing plan copy is derived from enforced plan limits", () => {
  const plans = structuredClone(PLANS);
  plans.free.limits.maxAssets = 7;
  plans.pro.limits.maxZipSizeBytes = 750 * 1024 * 1024;

  const presentation = getPlanPresentations(plans);

  assert.ok(presentation.free.highlights.includes("Até 7 itens por análise"));
  assert.ok(presentation.pro.highlights.includes("ZIPs de até 750 MB"));
});

test("comparison keeps analysis and download limits in separate categories", () => {
  const categories = getComparisonCategories(PLANS);

  assert.deepEqual(
    categories.map((category) => category.name),
    ["Análises", "Downloads"],
  );
  assert.equal(
    categories[0]?.rows.some((row) => row.feature === "Busca profunda em várias páginas"),
    true,
  );
  assert.equal(
    categories[1]?.rows.some((row) => row.feature === "Tamanho máximo do ZIP"),
    true,
  );
});
