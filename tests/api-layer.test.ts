import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

// The business API layer (lib/api/*): demo builds answer from lib/data without a request,
// real builds ask the API and map its answers onto the page types.

const originalFetch = globalThis.fetch;

type Layer = {
  api: typeof import("../lib/api");
  client: typeof import("../lib/api/client");
  monitors: typeof import("../lib/api/monitors");
  niches: typeof import("../lib/api/niches");
  agent: typeof import("../lib/api/agent");
  reports: typeof import("../lib/api/reports");
};

function loadLayer({ demo = false } = {}): Layer {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/api/v1";
  if (demo) process.env.NEXT_PUBLIC_DEMO_MODE = "true";
  else delete process.env.NEXT_PUBLIC_DEMO_MODE;
  for (const mod of ["../lib/env", "../lib/api", "../lib/auth", "../lib/demo", "../lib/api/client", "../lib/api/monitors", "../lib/api/niches", "../lib/api/agent", "../lib/api/reports"]) {
    delete require.cache[require.resolve(mod)];
  }
  return {
    api: require("../lib/api"),
    client: require("../lib/api/client"),
    monitors: require("../lib/api/monitors"),
    niches: require("../lib/api/niches"),
    agent: require("../lib/api/agent"),
    reports: require("../lib/api/reports"),
  };
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

function recordFetch(respond: (url: string, init?: RequestInit) => Response) {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return respond(String(input), init);
  }) as typeof fetch;
  return calls;
}

const apiMonitor = {
  id: "mon_1",
  kind: "product",
  name: "pagepulse.dev",
  description: "Uptime pages",
  site: "pagepulse.dev",
  x_query: '"pagepulse" -is:retweet',
  competitors: null,
  rank_keywords: ["uptime monitor"],
  tracks: ["mentions", "rankings"],
  delivery: "digest",
  channels: null,
  webhook: "",
  location_code: 2840,
  language_code: "en",
  locale: "en",
  interval_seconds: 86400,
  status: "paused",
  next_run_at: "2026-11-23T10:00:00Z",
  last_checked_at: "2026-11-23T09:00:00Z",
  created_at: "2026-11-20T08:00:00Z",
  updated_at: "2026-11-23T09:00:00Z",
  last_check: null,
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.NEXT_PUBLIC_DEMO_MODE;
});

test("real builds read monitors from the API and map them onto the page's Monitor", async () => {
  const { monitors } = loadLayer();
  const calls = recordFetch(() =>
    jsonResponse(200, { code: 200, data: { items: [apiMonitor], total: 1, limits: { plan: "free", monitors: 1, mentions: false, realtime: false, check_every: "day", x_posts: 0, x_posts_used: 0 } } }),
  );
  const list = await monitors.listMonitors("en");
  assert.equal(calls[0].url, "https://api.example.com/api/v1/monitors");
  assert.equal(list.limits?.monitors, 1);
  const [monitor] = list.monitors;
  assert.equal(monitor.xQuery, '"pagepulse" -is:retweet');
  assert.deepEqual(monitor.competitors, []);
  assert.deepEqual(monitor.rankKeywords, ["uptime monitor"]);
  assert.equal(monitor.channels, undefined);
  assert.equal(monitor.webhook, undefined);
  assert.equal(monitor.status, "paused");
  assert.equal(monitor.createdAt, Date.parse("2026-11-20T08:00:00Z"));
  assert.equal(monitor.lastCheckedAt, Date.parse("2026-11-23T09:00:00Z"));
  assert.equal(monitor.demo, undefined);
});

test("a new monitor is sent in the API's snake_case with the reader's language", async () => {
  const { monitors } = loadLayer();
  const calls = recordFetch(() => jsonResponse(201, { code: 200, data: apiMonitor }));
  await monitors.createMonitor(
    { kind: "keyword", name: "driftbound codes", description: "", site: "", xQuery: '"driftbound" -is:retweet', competitors: ["a.com"], rankKeywords: ["driftbound codes"], tracks: ["rankings"], delivery: "digest", channels: ["email"] },
    "zh",
  );
  assert.equal(calls[0].url, "https://api.example.com/api/v1/monitors");
  assert.equal(calls[0].init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    kind: "keyword",
    name: "driftbound codes",
    description: "",
    site: "",
    x_query: '"driftbound" -is:retweet',
    competitors: ["a.com"],
    rank_keywords: ["driftbound codes"],
    tracks: ["rankings"],
    delivery: "digest",
    channels: ["email"],
    locale: "zh",
  });
});

test("a monitor that was never checked has no feed yet", async () => {
  const { monitors } = loadLayer();
  const empty = { lastCheckedMinutes: null, postsToday: 0, postsThisMonth: 0, mentions: [], competitorMoves: [], rankings: [], trends: [], suggestions: [] };
  recordFetch(() => jsonResponse(200, { code: 200, data: empty }));
  assert.equal(await monitors.getMonitorFeed("mon_1", "en"), null);
  recordFetch(() => jsonResponse(200, { code: 200, data: { ...empty, lastCheckedMinutes: 12 } }));
  assert.equal((await monitors.getMonitorFeed("mon_1", "en"))?.lastCheckedMinutes, 12);
});

test("demo builds answer from demo data and never call the API", async () => {
  const { monitors, niches } = loadLayer({ demo: true });
  const calls = recordFetch(() => {
    throw new Error("no request in demo mode");
  });
  const list = await monitors.listMonitors("en");
  assert.ok(list.monitors.length > 0);
  assert.ok(list.monitors.every((monitor) => monitor.demo));
  assert.equal(list.limits, null);
  assert.ok((await niches.listNiches({ locale: "en" })).items.length > 0);
  assert.ok((await monitors.estimateXPosts('"driftbound codes"')).posts_per_day > 0);
  assert.equal(calls.length, 0);
});

test("without the trend library the API's 404 means coming soon, not demo data", async () => {
  const { niches, api } = loadLayer();
  recordFetch(() => jsonResponse(404, { code: 404, msg: "not found", data: null }));
  const error = await niches.listNiches({ locale: "en", track: "saas" }).catch((failure: unknown) => failure);
  assert.ok(niches.isComingSoon(error));
  assert.equal(niches.isComingSoon(new api.ApiError("boom", 500, 500)), false);
  assert.equal(niches.isComingSoon(new TypeError("offline")), false);
});

test("the trend list asks for the reader's language and filters", async () => {
  const { niches } = loadLayer();
  const calls = recordFetch(() => jsonResponse(200, { code: 200, data: { items: [], total: 0 } }));
  await niches.listNiches({ locale: "zh", track: "saas" });
  assert.equal(calls[0].url, "https://api.example.com/api/v1/niches?locale=zh&track=saas");
});

test("sending a message accepts the bare 202 answer and keeps refusals as ApiError with their code", async () => {
  const { agent, client } = loadLayer();
  const sent = { message: { id: "m1" }, run: { id: "r1", status: "queued" } };
  const calls = recordFetch(() => jsonResponse(202, sent));
  assert.deepEqual(await agent.sendMessage("c1", "hello", "req-1"), sent);
  assert.equal(calls[0].url, "https://api.example.com/api/v1/agent/platform/conversations/c1/messages");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { content: "hello", request_id: "req-1" });

  recordFetch(() => jsonResponse(409, { code: 409, msg: "busy", data: { code: "BUSY", run_id: "r0" } }, { "x-request-id": "rid-9" }));
  const error = await agent.sendMessage("c1", "again").catch((failure: unknown) => failure);
  assert.equal(client.errorCode(error), "BUSY");
  assert.equal((error as { status: number }).status, 409);
  assert.equal((error as { requestId: string }).requestId, "rid-9");
});

test("a shared report that is gone is null, other failures are errors", async () => {
  const { reports } = loadLayer();
  const calls = recordFetch(() => jsonResponse(200, { code: 200, data: { kind: "keyword", report: { id: "rep1", kind: "keyword" }, hidden: { nextSteps: 3 } } }));
  assert.equal((await reports.getSharedReport("abc", "en"))?.hidden?.nextSteps, 3);
  assert.equal(calls[0].url, "https://api.example.com/api/v1/shared-reports/abc");
  recordFetch(() => jsonResponse(404, { code: 404, msg: "not found", data: null }));
  assert.equal(await reports.getSharedReport("abc", "en"), null);
  recordFetch(() => jsonResponse(500, { code: 500, msg: "boom", data: null }));
  await assert.rejects(reports.getSharedReport("abc", "en"));
});

test("calls only the API can answer are refused in demo builds", async () => {
  const { monitors, agent } = loadLayer({ demo: true });
  await assert.rejects(monitors.pauseMonitor("mon-driftbound"));
  await assert.rejects(agent.listConversations());
});
