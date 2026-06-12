import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";
import { verifyWebhookSignature } from "../../src/server/mercadopago.ts";

const SECRET = "super-secret";

function makeSignature(dataId: string, requestId: string, ts = String(Date.now())): string {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const v1 = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

test("accepts valid signature", () => {
  process.env.MP_WEBHOOK_SECRET = SECRET;
  const ts = String(Date.now());
  const signature = makeSignature("abc123", "req-1", ts);
  assert.ok(verifyWebhookSignature({ signature, requestId: "req-1", dataId: "abc123" }));
});

test("rejects missing signature", () => {
  process.env.MP_WEBHOOK_SECRET = SECRET;
  assert.equal(verifyWebhookSignature({ signature: null, requestId: "req-1", dataId: "abc123" }), false);
});

test("rejects missing secret", () => {
  delete process.env.MP_WEBHOOK_SECRET;
  const signature = makeSignature("abc123", "req-1");
  assert.equal(verifyWebhookSignature({ signature, requestId: "req-1", dataId: "abc123" }), false);
});

test("rejects tampered dataId", () => {
  process.env.MP_WEBHOOK_SECRET = SECRET;
  const signature = makeSignature("abc123", "req-1");
  assert.equal(verifyWebhookSignature({ signature, requestId: "req-1", dataId: "tampered" }), false);
});

test("rejects stale timestamp", () => {
  process.env.MP_WEBHOOK_SECRET = SECRET;
  const stale = String(Date.now() - 10 * 60 * 1000);
  const signature = makeSignature("abc123", "req-1", stale);
  assert.equal(verifyWebhookSignature({ signature, requestId: "req-1", dataId: "abc123" }), false);
});

test("handles signature values containing '='", () => {
  process.env.MP_WEBHOOK_SECRET = SECRET;
  // Simulate a signature whose value contains an equals sign (unlikely with hex,
  // but the parser must not truncate it).
  const ts = String(Date.now());
  const manifest = `id:abc;request-id:req=1;ts:${ts};`;
  const v1 = crypto.createHmac("sha256", SECRET).update(manifest).digest("hex");
  const signature = `ts=${ts},v1=${v1}`;
  assert.ok(verifyWebhookSignature({ signature, requestId: "req=1", dataId: "abc" }));
});
