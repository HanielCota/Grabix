import assert from "node:assert/strict";
import { test } from "node:test";
import {
  classifyByExtension,
  extensionFromMime,
  getExtensionFromUrl,
  isMediaExtension,
} from "../../src/features/media-downloader/domain/media-extensions.ts";

test("recognizes GIF files as image media", () => {
  assert.equal(isMediaExtension("gif"), true);
  assert.equal(classifyByExtension("gif"), "IMAGE");
  assert.equal(extensionFromMime("image/gif"), "gif");
  assert.equal(getExtensionFromUrl("https://example.com/banner.gif?cache=1"), "gif");
});
