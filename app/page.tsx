import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Compass,
  Database,
  Lightbulb,
  Link2,
  MessageSquare,
  Radar,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BrandMark } from "@/components/brand-logo"
import { TryFreeButton } from "@/components/try-free-button"
import { OrganizationSchema, WebApplicationSchema } from "@/components/seo/structured-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const sourceChips = ["Ideas DB", "Idea Analysis", "Relevant Threads", "Reply Suggestions", "Lead Tracking"]

const dashboardPanels = [
  {
    title: "Relevant Threads",
    description: "Threads worth reading, replying to, or turning into your next outreach move.",
    icon: MessageSquare,
    accent: "text-[#8B5CF6] bg-[#F3EDFF]",
  },
  {
    title: "Reply Angles",
    description: "Suggested ways to join the conversation without sounding like a spammy pitch.",
    icon: Users,
    accent: "text-[#1479D6] bg-[#EAF6FF]",
  },
  {
    title: "Lead Follow-up",
    description: "People and communities worth tracking once you want Reddit to become a repeatable channel.",
    icon: Compass,
    accent: "text-[#D49A00] bg-[#FFF7D8]",
  },
]

const toolCards = [
  {
    href: "/dashboard/ideas",
    title: "Ideas DB",
    badge: "Free",
    description: "Browse a free database of startup, content, and niche opportunities before you commit to one.",
    bullets: [
      "Open opportunity database",
      "Source links to public discussions",
      "Best for wide exploration",
    ],
    icon: Lightbulb,
    iconTone: "text-[#D49A00] bg-[#FFF7D8]",
  },
  {
    href: "/dashboard/validate",
    title: "Idea Analysis",
    badge: "Free",
    description: "Paste a raw idea and get a free commercial read on demand, competition, pain points, and monetization potential.",
    bullets: [
      "Commercial opportunity score",
      "Pain point and competitor snapshot",
      "Best after you shortlist an idea",
    ],
    icon: BarChart3,
    iconTone: "text-[#1479D6] bg-[#EAF6FF]",
  },
  {
    href: "/dashboard",
    title: "Reddit Marketing Panel",
    badge: "Paid",
    description: "Turn Reddit into a workflow with thread discovery, reply suggestions, lead tracking, and ongoing follow-up.",
    bullets: [
      "Relevant thread feed",
      "Reply ideas and target users",
      "Best when you are ready to execute",
    ],
    icon: MessageSquare,
    iconTone: "text-[#8B5CF6] bg-[#F3EDFF]",
  },
]

const workflowSteps = [
  {
    step: "01",
    title: "Browse Ideas DB For Free",
    badge: "Discovery",
    description: "Start broad. Use the free Ideas DB to spot categories, patterns, and promising opportunities.",
  },
  {
    step: "02",
    title: "Run Free Idea Analysis",
    badge: "Judgment",
    description: "When one idea looks interesting, run free analysis to check demand, competition, pain points, and business potential.",
  },
  {
    step: "03",
    title: "Pay For Reddit Execution",
    badge: "Execution",
    description: "Upgrade only when you want the Reddit panel: threads to target, replies to write, leads to track, and a workflow to keep running.",
  },
]

const valueProps = [
  {
    title: "Free exploration first",
    description: "Users can explore opportunities without friction. That makes NichePop useful before any payment decision shows up.",
    icon: Target,
    iconTone: "text-[#8B5CF6] bg-[#F3EDFF]",
  },
  {
    title: "Free judgment second",
    description: "A free idea analysis turns a vague hunch into a clearer business decision before users commit time or money.",
    icon: Search,
    iconTone: "text-[#1479D6] bg-[#EAF6FF]",
  },
  {
    title: "Paid only at execution",
    description: "The real paywall sits where the value becomes operational: running Reddit marketing as a repeatable workflow.",
    icon: Link2,
    iconTone: "text-[#D49A00] bg-[#FFF7D8]",
  },
]

const personas = [
  "Indie hackers who want free opportunity discovery before they narrow down a bet",
  "Founders who want a quick business read on an idea before building more",
  "Builders who use Reddit as a customer discovery or outbound channel",
  "Small teams that need a repeatable Reddit workflow instead of ad hoc lurking",
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-transparent text-[#111111]">
      <OrganizationSchema />
      <WebApplicationSchema />
      <Navbar />

      <section className="relative isolate min-h-[calc(100vh-64px)] overflow-hidden bg-[#FAFAFA] pt-24 pb-16 sm:pt-28 sm:pb-20 lg:min-h-[980px] lg:pt-32">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[#FAFAFA]" />
          <div className="absolute top-[9.5rem] right-[-6rem] hidden h-[18rem] w-[18rem] rounded-full bg-[#F3F600]/38 lg:block" />
          <div className="absolute bottom-[-15rem] left-[-5.25rem] hidden h-[30rem] w-[30rem] rounded-full bg-[#F3F600]/38 lg:block" />

          <div className="absolute top-[15.5rem] left-[0.75rem] hidden h-[20rem] w-[10rem] overflow-hidden bg-[#FFECE2]/78 lg:block">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                backgroundImage:
                  "repeating-radial-gradient(ellipse at 24% 28%, transparent 0 12px, rgba(255,255,255,0.38) 13px 14px, transparent 15px 27px), repeating-radial-gradient(ellipse at 72% 66%, transparent 0 14px, rgba(255,255,255,0.34) 15px 16px, transparent 17px 31px), repeating-radial-gradient(ellipse at 34% 82%, transparent 0 10px, rgba(255,255,255,0.28) 11px 12px, transparent 13px 24px)",
                backgroundSize: "180px 220px, 210px 180px, 160px 170px",
                backgroundPosition: "-46px -28px, -74px 26px, -20px 80px",
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_42%,rgba(253,195,112,0.16))]" />
          </div>

          <div className="absolute right-[1.5rem] bottom-[6.5rem] hidden h-[20rem] w-[8.5rem] overflow-hidden bg-[#F7B6D8]/72 lg:block">
            <div
              className="absolute inset-0 opacity-58"
              style={{
                backgroundImage:
                  "linear-gradient(62deg, transparent 0 37%, rgba(255,255,255,0.26) 38% 45%, transparent 46% 100%), linear-gradient(-62deg, transparent 0 37%, rgba(255,255,255,0.24) 38% 45%, transparent 46% 100%), repeating-linear-gradient(62deg, rgba(218,74,154,0.12) 0 1px, transparent 1px 36px), repeating-linear-gradient(-62deg, rgba(218,74,154,0.11) 0 1px, transparent 1px 36px)",
                backgroundSize: "54px 68px, 54px 68px, 54px 68px, 54px 68px",
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.2),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.1),transparent)]" />
          </div>

          <div className="absolute right-[7rem] bottom-[5.5rem] hidden h-20 w-36 rounded-t-full bg-[#F9C6D2] lg:block" />
          <div className="absolute inset-x-0 bottom-0 h-[25rem] bg-[linear-gradient(rgba(17,17,17,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.045)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.72)_22%,black_100%)] bg-[size:32px_32px] opacity-65" />
          <div className="absolute top-12 right-[5%] hidden h-[14rem] w-[14rem] rounded-full border border-black/14 bg-[linear-gradient(rgba(17,17,17,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.08)_1px,transparent_1px)] bg-[size:35px_35px] lg:block" />
          <div className="absolute top-[6.5rem] left-[4.5%] hidden h-40 w-52 bg-[radial-gradient(circle,rgba(17,17,17,0.16)_1px,transparent_1.5px)] bg-[size:13px_13px] opacity-30 lg:block" />
          <div className="absolute top-[4.75rem] right-[12%] hidden h-44 w-56 bg-[radial-gradient(circle,rgba(17,17,17,0.16)_1px,transparent_1.5px)] bg-[size:13px_13px] opacity-30 lg:block" />
        </div>

        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="rounded-full border-[#E8E1F4] bg-white/90 px-4 py-1.5 text-xs text-[#7D4CE6] shadow-[0_8px_22px_rgba(125,76,230,0.08)]">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Two free tools. Upgrade only for Reddit execution.
                </Badge>

                <h1
                  className="max-w-4xl text-4xl font-black tracking-tight text-[#111111] sm:text-5xl lg:text-6xl"
                  style={{ fontFamily: "Space Grotesk, sans-serif", lineHeight: "1.04", letterSpacing: "-0.04em" }}
                >
                  Stop guessing what to build next.
                  <span className="block text-[#111111]">Find an opportunity, pressure-test it, then market it on Reddit.</span>
                </h1>

                <p className="max-w-2xl text-lg leading-8 text-[#6E677D] sm:text-xl">
                  Start in Ideas DB to browse real opportunities. When something looks promising, run a free Idea Analysis.
                  Upgrade only when you want the Reddit panel for threads, replies, and lead tracking.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.6rem] border border-[#E8E1F4] bg-white p-4 shadow-[0_18px_38px_rgba(77,54,42,0.06)]">
                  <div className="text-2xl font-bold text-[#8B5CF6]">1</div>
                  <div className="mt-1 text-sm text-[#6E677D]">Ideas DB is free</div>
                </div>
                <div className="rounded-[1.6rem] border border-[#E8E1F4] bg-white p-4 shadow-[0_18px_38px_rgba(77,54,42,0.06)]">
                  <div className="text-2xl font-bold text-[#1479D6]">2</div>
                  <div className="mt-1 text-sm text-[#6E677D]">Idea Analysis is free</div>
                </div>
                <div className="rounded-[1.6rem] border border-[#E8E1F4] bg-white p-4 shadow-[0_18px_38px_rgba(77,54,42,0.06)]">
                  <div className="text-2xl font-bold text-[#D49A00]">3</div>
                  <div className="mt-1 text-sm text-[#6E677D]">Reddit panel is paid</div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <TryFreeButton
                  guestHref="/dashboard/ideas"
                  authenticatedHref="/dashboard/ideas"
                  size="lg"
                  className="w-full rounded-full bg-[#111111] px-8 py-5 text-base font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#111111]/92 hover:shadow-[0_18px_34px_rgba(17,17,17,0.14)] sm:w-auto"
                >
                  Open Ideas DB
                  <ArrowRight className="ml-2 h-4 w-4" />
                </TryFreeButton>
                <Link href="/dashboard/validate">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full border-[#E8E1F4] bg-white/75 px-8 py-5 text-base text-[#111111] transition-all duration-200 hover:border-[#7D4CE6] hover:bg-[#F7F4FF] sm:w-auto"
                  >
                    Run Idea Analysis
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {sourceChips.map((source) => (
                  <span key={source} className="rounded-full border border-[#E8E1F4] bg-white px-3 py-1.5 text-xs text-[#6E677D] shadow-[0_8px_18px_rgba(77,54,42,0.04)]">
                    {source}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-5 text-sm text-[#6E677D]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#43B86E]" />
                  Ideas DB stays free
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#43B86E]" />
                  Idea Analysis stays free
                </div>
              </div>
            </div>

            <Card className="overflow-hidden rounded-[2rem] border-[#E8E1F4] bg-white shadow-[0_30px_80px_rgba(77,54,42,0.1)]">
              <CardContent className="p-4 sm:p-6">
                <div className="rounded-[1.7rem] border border-[#E8E1F4] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-[#E8E1F4] bg-white shadow-[0_10px_20px_rgba(125,76,230,0.08)]">
                        <BrandMark className="h-7 w-7" withGlow />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#111111]">Reddit Marketing Panel</div>
                        <div className="text-xs text-[#6E677D]">The paid execution workflow</div>
                      </div>
                    </div>
                    <Badge className="border-[#E8E1F4] bg-white text-[#6E677D]">Paid workflow</Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div className="rounded-[1.9rem] border border-[#E8E1F4] bg-[#F3EDFF] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#7D7590]">What the paid panel does</p>
                        <h2 className="mt-2 text-xl font-bold text-[#111111]">Threads → Replies → Leads</h2>
                      </div>
                      <Radar className="h-5 w-5 text-[#8B5CF6]" />
                    </div>
                    <div className="mt-4 grid gap-3">
                      {dashboardPanels.map((panel) => {
                        const Icon = panel.icon
                        return (
                          <div key={panel.title} className="rounded-[1.35rem] border border-[#E8E1F4] bg-white/88 p-4">
                            <div className="flex items-center gap-3">
                              <div className={`rounded-[1rem] p-2.5 ${panel.accent}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold text-[#111111]">{panel.title}</h3>
                                <p className="mt-1 text-sm leading-6 text-[#6E677D]">{panel.description}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.9rem] border border-[#E8E1F4] bg-[#FFF7D8] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#7D7590]">Why users pay</p>
                        <h2 className="mt-2 text-xl font-bold text-[#111111]">Execution is the premium layer</h2>
                      </div>
                      <Target className="h-5 w-5 text-[#D49A00]" />
                    </div>
                    <div className="mt-4 rounded-[1.35rem] border border-[#E8E1F4] bg-white/80 p-4">
                      <p className="text-sm leading-7 text-[#6E677D]">
                        Free tools help users discover and judge ideas. The paid layer starts when they want Reddit threads,
                        reply suggestions, lead lists, and a workflow they can keep using every week.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-18 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-[#111111] sm:text-4xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              The product should match the real buying sequence.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-[#6E677D]">
              Users usually move through three questions in order: what opportunities exist, is this idea commercially interesting,
              and only then how do I turn Reddit into a working acquisition channel.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <Card key={step.title} className="rounded-[1.9rem] border-[#E8E1F4] bg-white/88 shadow-[0_18px_40px_rgba(77,54,42,0.06)]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-[0.24em] text-[#7D7590]">{step.step}</div>
                    <Badge className="border-[#E8E1F4] bg-[#F7F4FF] text-[#6E677D]">{step.badge}</Badge>
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-[#111111]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#6E677D]">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#E8E1F4] bg-white/55 py-18 backdrop-blur-sm sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge className="border-[#E8E1F4] bg-white px-3 py-1 text-xs text-[#6E677D]">Core Features</Badge>
            <h2 className="mt-5 text-4xl font-black tracking-tight text-[#111111] sm:text-5xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Three products. Two are free. One is paid.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#6E677D]">
              This is the cleanest way to explain NichePop: a free database for idea discovery, a free analysis tool for business judgment,
              and a paid Reddit workflow for execution.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {toolCards.map((tool) => {
              const Icon = tool.icon
              return (
                <Link key={tool.href} href={tool.href}>
                  <Card className="h-full rounded-[1.9rem] border-[#E8E1F4] bg-white/92 transition-all hover:border-[#D8CCF2] hover:shadow-[0_22px_48px_rgba(125,76,230,0.08)]">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Badge className="border-[#E8E1F4] bg-[#F7F4FF] text-[#6E677D]">{tool.badge}</Badge>
                          <CardTitle className="mt-4 text-2xl font-bold text-[#111111]">{tool.title}</CardTitle>
                        </div>
                        <div className={`rounded-[1rem] border border-[#E8E1F4] p-3 ${tool.iconTone}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <CardDescription className="text-sm leading-7 text-[#6E677D]">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {tool.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-sm text-[#6E677D]">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#43B86E]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-18 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-black tracking-tight text-[#111111] sm:text-5xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              Why this structure converts better
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6E677D]">
              It gives away discovery and judgment for free, then charges only when users are ready to do repetitive Reddit marketing work.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {valueProps.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="rounded-[1.9rem] border-[#E8E1F4] bg-white/88 shadow-[0_18px_40px_rgba(77,54,42,0.06)]">
                  <CardHeader>
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-[1.2rem] ${item.iconTone}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold text-[#111111]">{item.title}</CardTitle>
                    <CardDescription className="text-sm leading-7 text-[#6E677D]">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[2rem] border-[#E8E1F4] bg-white/88 shadow-[0_18px_40px_rgba(77,54,42,0.06)]">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#111111]">Who this fits best</CardTitle>
                <CardDescription className="text-[#6E677D]">Built for lean teams that discover ideas fast, judge them fast, and execute in Reddit when they are serious.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {personas.map((persona) => (
                  <div key={persona} className="flex gap-3 rounded-[1.35rem] border border-[#E8E1F4] bg-[#F7F4FF]/75 p-4">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#43B86E]" />
                    <span className="text-sm text-[#6E677D]">{persona}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-[#E8E1F4] bg-white/88 shadow-[0_18px_40px_rgba(77,54,42,0.06)]">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#111111]">What powers the product</CardTitle>
                <CardDescription className="text-[#6E677D]">The free tools help you find and judge opportunities. The paid panel helps you execute on Reddit.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.35rem] border border-[#E8E1F4] bg-[#F7F4FF]/75 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#EAF6FF] text-[#1479D6]">
                    <Database className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-[#111111]">Ideas DB</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6E677D]">A free database of opportunities pulled from search and conversation signals.</p>
                </div>
                <div className="rounded-[1.35rem] border border-[#E8E1F4] bg-[#F7F4FF]/75 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#F3EDFF] text-[#8B5CF6]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-[#111111]">Idea Analysis</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6E677D]">A free commercial read on whether a specific idea has enough demand and room to matter.</p>
                </div>
                <div className="rounded-[1.35rem] border border-[#E8E1F4] bg-[#F7F4FF]/75 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#FFF7D8] text-[#D49A00]">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-[#111111]">Reddit thread targeting</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6E677D]">The paid panel surfaces which posts and communities deserve action right now.</p>
                </div>
                <div className="rounded-[1.35rem] border border-[#E8E1F4] bg-[#F7F4FF]/75 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#EAF6FF] text-[#1479D6]">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-[#111111]">Lead follow-up</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6E677D]">The paid workflow keeps track of who to reply to, who to revisit, and where the best leads are forming.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-18 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7D4CE6]/10 blur-3xl" />
        </div>
        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden rounded-[2.2rem] border-[#E8E1F4] bg-[linear-gradient(135deg,#FFFFFF_0%,#F7F4FF_60%,#EFE9FF_100%)] shadow-[0_30px_80px_rgba(77,54,42,0.1)] backdrop-blur-xl">
            <CardContent className="p-8 text-center sm:p-12">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-[#E8E1F4] bg-white shadow-[0_0_40px_rgba(125,76,230,0.1)]">
                <BrandMark className="h-11 w-11" withGlow />
              </div>
              <h2 className="mt-8 text-4xl font-black tracking-tight text-[#111111] sm:text-5xl" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Start with the free tools.
                <span className="block text-[#111111]">Upgrade when you want Reddit to become a real channel.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-[#6E677D]">
                Use Ideas DB to find angles worth exploring. Use Idea Analysis to see if they have business potential.
                The paid panel is for doing the actual Reddit work.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <TryFreeButton
                  guestHref="/dashboard/ideas"
                  authenticatedHref="/dashboard/ideas"
                  size="lg"
                  className="w-full rounded-full bg-[#111111] px-8 py-5 text-base font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#111111]/92 sm:w-auto"
                >
                  Browse Ideas DB
                  <ArrowRight className="ml-2 h-4 w-4" />
                </TryFreeButton>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full rounded-full border-[#E8E1F4] bg-white/75 px-8 py-5 text-base text-[#111111] hover:border-[#7D4CE6] hover:bg-[#F7F4FF] sm:w-auto"
                  >
                    See Reddit Pricing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
