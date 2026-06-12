import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";
import { checkRateLimit } from "../../src/server/rate-limit.ts";

test("allows requests under the limit", async () => {
  const key = `test:${crypto.randomUUID()}`;
  for (let i = 0; i < 5; i++) {
    const result = await checkRateLimit(key, { max: 5, windowMs: 60_000 });
    assert.equal(result.limited, false);
    assert.equal(result.limit, 5);
  }
});

test("blocks requests over the limit", async () => {
  const key = `test:${crypto.randomUUID()}`;
  for (let i = 0; i < 3; i++) {
    await checkRateLimit(key, { max: 2, windowMs: 60_000 });
  }
  const result = await checkRateLimit(key, { max: 2, windowMs: 60_000 });
  assert.equal(result.limited, true);
  assert.equal(result.remaining, 0);
});

test("resets the window after it expires", async () => {
  const key = `test:${crypto.randomUUID()}`;
  await checkRateLimit(key, { max: 1, windowMs: 50 });
  const limited = await checkRateLimit(key, { max: 1, windowMs: 50 });
  assert.equal(limited.limited, true);

  await new Promise((resolve) => setTimeout(resolve, 60));
  const reset = await checkRateLimit(key, { max: 1, windowMs: 50 });
  assert.equal(reset.limited, false);
});
