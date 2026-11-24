import assert from "node:assert/strict";
import { test } from "node:test";
import { relativeTime } from "../lib/utils/relative-time";

const now = Date.UTC(2026, 10, 24, 12, 0);
const minute = 60_000;

test("relative times use the largest unit that fits, in the reader's language", () => {
  assert.equal(relativeTime(now - 5 * minute, now, "en"), "5 minutes ago");
  assert.equal(relativeTime(now + 42 * minute, now, "en"), "in 42 minutes");
  assert.equal(relativeTime(now - 3 * 60 * minute, now, "en"), "3 hours ago");
  assert.equal(relativeTime(now - 2 * 24 * 60 * minute, now, "en"), "2 days ago");
  assert.equal(relativeTime(now - 5 * minute, now, "zh"), "5分钟前");
});

test("under a minute is just now, or in a moment", () => {
  assert.equal(relativeTime(now - 10_000, now, "en"), "just now");
  assert.equal(relativeTime(now + 10_000, now, "en"), "in a moment");
  assert.equal(relativeTime(now, now, "zh"), "马上");
});
