import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

// The Ask AI page follows a run over server-sent events (backend docs/agent-platform.md) and folds
// each event into the message it belongs to (lib/data/chat.ts).

import { applyRunEvent, failRun, newRun, stepDetail, type ChatMessage } from "../lib/data/chat";
import type { RunEvent } from "../lib/api/agent";
import { followRun, readSse, StreamLostError } from "../lib/api/run-stream";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function body(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

const sse = (id: number, type: string, data: unknown) => `id: ${id}\nevent: ${type}\ndata: ${JSON.stringify(data)}\n\n`;

test("SSE: events split across chunks, CRLF lines, keep-alive comments and multi-line data", async () => {
  const stream = body(['id: 1\r\nevent: run.created\r\nda', 'ta: {"run_id":"r1"}\r\n\r\n: keep-alive\n\n', "id: 2\nevent: message.delta\ndata: {\"delta\":\ndata: \"hi\"}\n\n"]);
  const seen = [];
  for await (const message of readSse(stream)) seen.push(message);
  assert.deepEqual(seen, [
    { id: "1", event: "run.created", data: '{"run_id":"r1"}' },
    { id: "2", event: "message.delta", data: '{"delta":\n"hi"}' },
  ]);
});

test("a dropped stream is picked up after the last event it showed, until the run ends", async () => {
  const types: string[] = [];
  const reopened: [string, string][] = [];
  const first = new Response(body([sse(1, "run.created", { run_id: "run_7" }), sse(2, "tool.started", { id: "t1", tool: "serp_top" })]));
  await followRun(first, {
    onMessage: (message) => types.push(message.type),
    reopen: async (runId, after) => {
      reopened.push([runId, after]);
      return new Response(body([sse(3, "tool.completed", { id: "t1", tool: "serp_top" }), sse(4, "run.completed", { credits_charged: 1 })]));
    },
    wait: async () => {},
  });
  assert.deepEqual(reopened, [["run_7", "2"]]);
  assert.deepEqual(types, ["run.created", "tool.started", "tool.completed", "run.completed"]);
});

test("a stream that drops before the run is known, or keeps dropping, is lost", async () => {
  const noRun = new Response(body([": keep-alive\n\n"]));
  await assert.rejects(followRun(noRun, { onMessage: () => {}, reopen: async () => new Response(null), wait: async () => {} }), StreamLostError);

  let reopens = 0;
  const started = new Response(body([sse(1, "run.created", { run_id: "run_8" })]));
  await assert.rejects(
    followRun(started, { onMessage: () => {}, reopen: async () => (reopens++, new Response(body([]))), retries: 2, wait: async () => {} }),
    StreamLostError,
  );
  assert.equal(reopens, 2);
});

test("sending streams the reply from POST .../messages; a refusal keeps its code", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/api/v1";
  delete process.env.NEXT_PUBLIC_DEMO_MODE;
  for (const mod of ["../lib/env", "../lib/api", "../lib/auth", "../lib/demo", "../lib/api/client", "../lib/api/agent", "../lib/api/reports"]) {
    delete require.cache[require.resolve(mod)];
  }
  const agent: typeof import("../lib/api/agent") = require("../lib/api/agent");
  const reports: typeof import("../lib/api/reports") = require("../lib/api/reports");
  const client: typeof import("../lib/api/client") = require("../lib/api/client");

  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return new Response(body([sse(1, "run.created", { run_id: "r1" }), sse(2, "message.delta", { delta: "Hello" }), sse(3, "unknown.event", {}), sse(4, "run.completed", {})]), {
      headers: { "content-type": "text/event-stream" },
    });
  }) as typeof fetch;
  const events: RunEvent[] = [];
  await agent.streamMessage("c1", "how do I pick a niche?", "req-1", { onEvent: (event) => events.push(event) });
  assert.equal(calls[0].url, "https://api.example.com/api/v1/agent/platform/conversations/c1/messages");
  assert.equal(calls[0].init?.method, "POST");
  assert.equal((calls[0].init?.headers as Record<string, string>).Accept, "text/event-stream");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { content: "how do I pick a niche?", request_id: "req-1" });
  assert.deepEqual(events.map((e) => e.type), ["run.created", "message.delta", "run.completed"]);

  await reports.streamReport("c1", "keyword", "driftbound codes", "req-2", { onEvent: () => {} });
  assert.equal(calls[1].url, "https://api.example.com/api/v1/agent/platform/conversations/c1/reports");
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), { kind: "keyword", subject: "driftbound codes", request_id: "req-2" });

  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ code: 402, msg: "not enough credits", data: { code: "INSUFFICIENT_CREDITS", need: 7, balance: 3 } }), {
      status: 402,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
  const error = await reports.streamReport("c1", "keyword", "x", "req-3", { onEvent: () => {} }).catch((failure: unknown) => failure);
  assert.equal(client.errorCode(error), "INSUFFICIENT_CREDITS");
  assert.deepEqual((error as { data: unknown }).data, { code: "INSUFFICIENT_CREDITS", need: 7, balance: 3 });
});

let seq = 0;
const ev = <T extends RunEvent["type"]>(type: T, data: Extract<RunEvent, { type: T }>["data"]) => ({ id: String(++seq), type, data }) as RunEvent;

test("a reply streams its text, its lookups and their charges, and its sources", () => {
  let messages: ChatMessage[] = [{ id: "m1", role: "ai", type: "text", text: "", sources: [], ...newRun() }];
  const events = [
    ev("run.created", { run_id: "r1" }),
    ev("tool.started", { id: "t1", tool: "nichepop.keyword_metrics", detail: '{"keyword":"uptime monitor"}' }),
    ev("credits.charged", { tool: "keyword_metrics", credits: 1, credits_charged: 1 }),
    ev("tool.completed", { id: "t1", tool: "nichepop.keyword_metrics" }),
    ev("message.delta", { delta: "Demand is " }),
    ev("message.delta", { delta: "steady." }),
    ev("source.added", { url: "https://example.com" }),
    ev("source.added", { url: "https://example.com" }),
    ev("run.notice", { code: "ROUND_LIMIT" }),
    ev("run.completed", { credits_charged: 2 }),
  ];
  for (const event of events) messages = applyRunEvent(messages, "m1", event);
  const reply = messages[0];
  assert.ok(reply.role === "ai" && reply.type === "text");
  assert.equal(reply.runId, "r1");
  assert.equal(reply.text, "Demand is steady.");
  assert.deepEqual(reply.steps, [{ id: "t1", tool: "nichepop.keyword_metrics", detail: "uptime monitor", status: "done", credits: 1 }]);
  assert.deepEqual(reply.sources, ["https://example.com"]);
  assert.deepEqual(reply.notices, ["ROUND_LIMIT"]);
  assert.equal(reply.status, "done");
  assert.equal(reply.points, 2);
});

test("a report subject is answered with an offer in place of the reply", () => {
  const offer = { kind: "keyword" as const, subject: "driftbound codes", estimate_credits: [5, 7] as [number, number], kinds: ["keyword" as const, "idea" as const] };
  const messages = applyRunEvent([{ id: "m1", role: "ai", type: "text", text: "", sources: [], ...newRun() }], "m1", ev("report.offer", offer));
  assert.deepEqual(messages, [{ id: "m1", role: "ai", type: "offer", offer, kind: "keyword" }]);
});

test("a report collects its steps, then the report and its follow-ups; a failed one shows the refund", () => {
  let messages: ChatMessage[] = [{ id: "r", role: "report", kind: "keyword", subject: "driftbound codes", ...newRun() }, { id: "later", role: "user", text: "next" }];
  const report = { id: "rpt_1", kind: "keyword", query: "driftbound codes" } as never;
  for (const event of [
    ev("tool.started", { id: "a", tool: "serp_top", detail: '{"keyword":"driftbound codes"}' }),
    ev("tool.started", { id: "b", tool: "serp_top", detail: '{"keyword":"driftbound wiki"}' }),
    ev("credits.charged", { tool: "serp_top", credits: 1, credits_charged: 1 }),
    ev("tool.completed", { id: "b", tool: "serp_top" }),
    ev("tool.completed", { id: "a", tool: "serp_top", error: "limit reached" }),
    ev("report.completed", { report_id: "rpt_1", report }),
    ev("report.followup", { report_id: "rpt_1", follow_ups: ["Who ranks now?"] }),
    ev("report.followup", { report_id: "rpt_1", follow_ups: ["Who ranks now?"] }),
    ev("run.completed", { report_id: "rpt_1", credits_charged: 3 }),
  ]) {
    messages = applyRunEvent(messages, "r", event);
  }
  const [done, followUp, later] = messages;
  assert.ok(done.role === "report");
  assert.deepEqual(done.steps.map((s) => [s.id, s.status, s.credits]), [["a", "error", 0], ["b", "done", 1]]);
  assert.equal(done.report, report);
  assert.equal(done.reportId, "rpt_1");
  assert.equal(done.points, 3);
  assert.deepEqual(followUp, { id: "r-followup", role: "ai", type: "followup", kind: "keyword", reportId: "rpt_1", followUps: ["Who ranks now?"] });
  assert.equal(later.id, "later");

  let failed: ChatMessage[] = [{ id: "r", role: "report", kind: "idea", subject: "x", ...newRun() }];
  failed = applyRunEvent(failed, "r", ev("tool.started", { id: "a", tool: "reddit_search" }));
  failed = applyRunEvent(failed, "r", ev("run.failed", { code: "TIMEOUT", credits_refunded: 4 }));
  failed = applyRunEvent(failed, "r", ev("credits.refunded", { credits: 1 }));
  const [ended] = failed;
  assert.ok(ended.role === "report");
  assert.equal(ended.status, "failed");
  assert.deepEqual(ended.error, { code: "TIMEOUT" });
  assert.equal(ended.refunded, 5);
  assert.equal(ended.steps[0].status, "error");
});

test("a run refused before it started fails with the reason; a finished one is left alone", () => {
  const running: ChatMessage[] = [{ id: "m", role: "ai", type: "text", text: "", sources: [], ...newRun() }];
  const [refused] = failRun(running, "m", { code: "INSUFFICIENT_CREDITS", need: 7, balance: 3 });
  assert.ok(refused.role === "ai" && refused.type === "text" && refused.status === "failed");
  assert.deepEqual(refused.error, { code: "INSUFFICIENT_CREDITS", need: 7, balance: 3 });

  const finished = applyRunEvent(running, "m", ev("run.completed", {}));
  assert.equal(failRun(finished, "m", { code: "STREAM_LOST" })[0], finished[0]);
});

test("a step reads as its keyword or query, not its JSON", () => {
  assert.equal(stepDetail('{"keyword":"driftbound codes","limit":20}'), "driftbound codes");
  assert.equal(stepDetail('{"site":"a.com","competitor":"b.com"}'), "a.com");
  assert.equal(stepDetail("best uptime tools"), "best uptime tools");
  assert.equal(stepDetail(""), "");
  assert.equal(stepDetail("x".repeat(100)).length, 80);
});
