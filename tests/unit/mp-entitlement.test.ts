import assert from "node:assert/strict";
import { test } from "node:test";
import { mapPaymentStatus, mapPreapprovalStatus, PRO_PASS_DURATION_MS } from "../../src/server/mp-entitlement.ts";

// Fixed clock so the +1-month window is asserted exactly.
const NOW = 1_700_000_000_000;

test("payment approved → 1-month Pro pass", () => {
  const e = mapPaymentStatus({ id: 123, status: "approved" }, NOW);
  assert.ok(e);
  assert.equal(e.plan, "pro");
  assert.equal(e.status, "active");
  assert.equal(e.provider, "mercadopago");
  assert.equal(e.externalId, "123"); // numeric id is stringified
  assert.equal(e.currentPeriodEnd?.getTime(), NOW + PRO_PASS_DURATION_MS);
});

test("payment refunded → revokes immediately (no period)", () => {
  const e = mapPaymentStatus({ id: "p1", status: "refunded" }, NOW);
  assert.equal(e?.status, "refunded");
  assert.equal(e?.currentPeriodEnd, null);
});

test("payment charged_back → chargeback", () => {
  assert.equal(mapPaymentStatus({ id: 1, status: "charged_back" }, NOW)?.status, "chargeback");
});

test("payment non-terminal statuses grant nothing", () => {
  for (const status of ["pending", "in_process", "rejected", "cancelled", "anything"]) {
    assert.equal(mapPaymentStatus({ id: 1, status }, NOW), null);
  }
});

test("preapproval authorized → active, honoring next_payment_date", () => {
  const e = mapPreapprovalStatus({ id: "s1", status: "authorized", next_payment_date: "2030-01-01T00:00:00Z" }, NOW);
  assert.equal(e?.status, "active");
  assert.equal(e?.currentPeriodEnd?.toISOString(), "2030-01-01T00:00:00.000Z");
});

test("preapproval authorized without date falls back to +1 month", () => {
  const e = mapPreapprovalStatus({ id: "s1", status: "authorized" }, NOW);
  assert.equal(e?.currentPeriodEnd?.getTime(), NOW + PRO_PASS_DURATION_MS);
});

test("preapproval cancelled/paused/pending mapping", () => {
  assert.equal(mapPreapprovalStatus({ id: "s", status: "cancelled" }, NOW)?.status, "canceled");
  assert.equal(mapPreapprovalStatus({ id: "s", status: "paused" }, NOW)?.status, "past_due");
  assert.equal(mapPreapprovalStatus({ id: "s", status: "pending" }, NOW), null);
});

test("cancelled without a date leaves the period untouched (undefined, not null)", () => {
  // undefined → upsertSubscription preserves the existing paid-through date so the
  // user keeps access until it actually ends.
  const e = mapPreapprovalStatus({ id: "s", status: "cancelled" }, NOW);
  assert.equal(e?.currentPeriodEnd, undefined);
});

test("cancelled with a next_payment_date carries that date", () => {
  const e = mapPreapprovalStatus({ id: "s", status: "cancelled", next_payment_date: "2030-01-01T00:00:00Z" }, NOW);
  assert.equal(e?.currentPeriodEnd?.toISOString(), "2030-01-01T00:00:00.000Z");
});

test("paused leaves the period untouched (undefined)", () => {
  const e = mapPreapprovalStatus({ id: "s", status: "paused" }, NOW);
  assert.equal(e?.currentPeriodEnd, undefined);
});
