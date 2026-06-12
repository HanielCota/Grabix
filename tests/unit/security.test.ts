import assert from "node:assert/strict";
import { test } from "node:test";
import { validateUrlFormat } from "../../src/server/security.ts";

test("rejects empty URL", async () => {
  await assert.rejects(() => validateUrlFormat(""), /URL não pode ser vazia/);
});

test("rejects malformed URL", async () => {
  await assert.rejects(() => validateUrlFormat("https://"), /URL malformada/);
});

test("rejects non-HTTP schemes", async () => {
  await assert.rejects(() => validateUrlFormat("file:///etc/passwd"), /Apenas HTTP e HTTPS/);
  await assert.rejects(() => validateUrlFormat("ftp://example.com"), /Apenas HTTP e HTTPS/);
});

test("rejects private hostnames", async () => {
  for (const host of ["localhost", "127.0.0.1", "10.0.0.1", "192.168.1.1", "0.0.0.0"]) {
    await assert.rejects(() => validateUrlFormat(`http://${host}/`), /restrito/);
  }
});

test("accepts public HTTP and HTTPS URLs", async () => {
  for (const url of ["https://example.com", "http://example.com/path", "https://example.com:443/"]) {
    const result = await validateUrlFormat(url);
    assert.equal(result.protocol, url.startsWith("https") ? "https:" : "http:");
  }
});
