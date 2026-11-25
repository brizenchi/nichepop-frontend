import assert from "node:assert/strict";
import { test } from "node:test";

import { parseMarkdown } from "../lib/markdown";

// Replies of the analyst are Markdown (lib/markdown.ts); the page lays out these blocks.

test("headings, lists, tables, code and paragraphs become blocks", () => {
  const text = [
    "## SEO page outline",
    "",
    "- **Primary keyword:** notion habit tracker",
    "  with a progress bar",
    "- Free download",
    "",
    "1. Preview",
    "2. Setup guide",
    "",
    "| Feature | Free |",
    "|---|:---:|",
    "| Daily tracking | ✓ |",
    "",
    "```",
    "const a = 1",
    "```",
    "",
    "> quoted",
    "",
    "---",
    "Plain text",
    "on two lines",
  ].join("\n");
  assert.deepEqual(parseMarkdown(text), [
    { type: "heading", level: 2, text: "SEO page outline" },
    { type: "list", ordered: false, items: ["**Primary keyword:** notion habit tracker with a progress bar", "Free download"] },
    { type: "list", ordered: true, items: ["Preview", "Setup guide"] },
    { type: "table", header: ["Feature", "Free"], rows: [["Daily tracking", "✓"]] },
    { type: "code", text: "const a = 1" },
    { type: "quote", text: "quoted" },
    { type: "rule" },
    { type: "paragraph", text: "Plain text\non two lines" },
  ]);
});

test("text still streaming in parses without an end", () => {
  assert.deepEqual(parseMarkdown("```\npartial"), [{ type: "code", text: "partial" }]);
  assert.deepEqual(parseMarkdown("| a | b |"), [{ type: "paragraph", text: "| a | b |" }]);
  assert.deepEqual(parseMarkdown(""), []);
});
