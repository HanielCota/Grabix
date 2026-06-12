import assert from "node:assert/strict";
import { test } from "node:test";
import { isActive } from "../../src/server/entitlements.ts";

test("active without end date is active", () => {
  assert.equal(isActive("active", undefined), true);
  assert.equal(isActive("active", null), true);
});

test("active with future end date is active", () => {
  assert.equal(isActive("active", new Date(Date.now() + 24 * 60 * 60 * 1000)), true);
});

test("active with past end date is inactive", () => {
  assert.equal(isActive("active", new Date(Date.now() - 24 * 60 * 60 * 1000)), false);
});

test("canceled keeps access until period ends", () => {
  assert.equal(isActive("canceled", new Date(Date.now() + 24 * 60 * 60 * 1000)), true);
  assert.equal(isActive("canceled", new Date(Date.now() - 24 * 60 * 60 * 1000)), false);
  assert.equal(isActive("canceled", undefined), false);
});

test("revoked statuses are always inactive", () => {
  for (const status of ["refunded", "chargeback", "expired", "inactive", "past_due"]) {
    assert.equal(isActive(status, new Date(Date.now() + 24 * 60 * 60 * 1000)), false);
  }
});
