"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PricingCards } from "@/components/pricing-cards"
import { PricingSchema } from "@/components/seo/pricing-schema"
import { FAQSchema } from "@/components/seo/structured-data"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle2, Sparkles } from "lucide-react"

const faqs = [
  {
    question: "Can I try NichePop for free?",
    answer: "Yes. Ideas DB is free, and Idea Analysis is free. You only pay when you want the Reddit Marketing panel and ongoing workflow.",
  },
  {
    question: "What is the paid product?",
    answer: "The paid product is Reddit Marketing. It gives you the panel for finding threads, drafting replies, surfacing leads, and saving follow-up work.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely! You can cancel your subscription at any time with no questions asked. Your access will continue until the end of your current billing period.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with NichePop for any reason, contact us within 30 days of your purchase for a full refund.",
  },
  {
    question: "What do I get on the free plan?",
    answer: "You can browse Ideas DB, run Idea Analysis for free, and inspect source-backed signals before you pay for any workflow.",
  },
  {
    question: "What does Reddit Marketing unlock?",
    answer: "It unlocks the paid Reddit panel: relevant threads, reply suggestions, lead tracking, saved workspaces, and repeatable follow-up.",
  },
  {
    question: "Can I switch between plans?",
    answer: "Yes. You can upgrade into Reddit Marketing or cancel it anytime. Billing changes take effect according to your current billing cycle.",
  },
  {
    question: "Is there a discount for annual billing?",
    answer: "Yes! Annual plans save you 17% compared to monthly billing. That's 2 months free when you pay annually.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure payment processor Stripe. We also support PayPal for your convenience.",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-transparent text-[#111111]">
      <PricingSchema />
      <FAQSchema faqs={faqs} />
      <Navbar />

      <main className="relative overflow-hidden bg-[#FAFAFA] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[#FAFAFA]" />
          <div className="absolute top-28 right-[-5rem] hidden h-56 w-56 rounded-full bg-[#F3F600]/30 lg:block" />
          <div className="absolute bottom-[-8rem] left-[-4rem] hidden h-72 w-72 rounded-full bg-[#F3F600]/28 lg:block" />
          <div className="absolute top-40 left-0 hidden h-56 w-24 overflow-hidden bg-[#FFECE2]/78 lg:block">
            <div
              className="absolute inset-0 opacity-75"
              style={{
                backgroundImage:
                  "repeating-radial-gradient(ellipse at 24% 28%, transparent 0 12px, rgba(255,255,255,0.38) 13px 14px, transparent 15px 27px), repeating-radial-gradient(ellipse at 72% 66%, transparent 0 14px, rgba(255,255,255,0.34) 15px 16px, transparent 17px 31px)",
                backgroundSize: "180px 220px, 210px 180px",
                backgroundPosition: "-46px -28px, -74px 26px",
              }}
            />
          </div>
          <div className="absolute right-5 bottom-32 hidden h-64 w-24 overflow-hidden bg-[#F7B6D8]/72 lg:block">
            <div
              className="absolute inset-0 opacity-58"
              style={{
                backgroundImage:
                  "linear-gradient(62deg, transparent 0 37%, rgba(255,255,255,0.26) 38% 45%, transparent 46% 100%), linear-gradient(-62deg, transparent 0 37%, rgba(255,255,255,0.24) 38% 45%, transparent 46% 100%), repeating-linear-gradient(62deg, rgba(218,74,154,0.12) 0 1px, transparent 1px 36px), repeating-linear-gradient(-62deg, rgba(218,74,154,0.11) 0 1px, transparent 1px 36px)",
                backgroundSize: "54px 68px, 54px 68px, 54px 68px, 54px 68px",
              }}
            />
          </div>
          <div className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(rgba(17,17,17,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.04)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.45)_55%,transparent_100%)] bg-[size:34px_34px] opacity-55" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="mb-16 text-center space-y-6">
            <Badge className="border-[#E8E1F4] bg-white/90 px-4 py-1.5 text-xs text-[#7D4CE6] shadow-[0_8px_22px_rgba(125,76,230,0.08)]">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Two free tools. One paid Reddit workflow.
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#111111]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Free ideas and free analysis.
              <span className="block">Pay only for Reddit marketing.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#6E677D] max-w-2xl mx-auto leading-relaxed font-light">
              Start with Ideas DB and Idea Analysis for free. Upgrade only when you want a working Reddit panel with threads, replies, leads, and follow-up.
            </p>
          </div>

          <PricingCards />

          <div className="mt-20 pt-16 border-t border-[#E8E1F4]">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111111] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                What The Paid Panel Adds
              </h2>
              <p className="text-[#6E677D]">
                You already get discovery and idea judgment for free. This is what teams pay for when they need Reddit execution.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {[
                "Relevant Reddit threads worth replying to",
                "Reply suggestions and post angles",
                "Potential customer lead surfacing",
                "Saved workspaces for repeated follow-up",
                "Ongoing monitoring instead of manual lurking",
                "One panel for thread discovery, replies, and leads",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#43B86E] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#6E677D]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 pt-16 border-t border-[#E8E1F4]">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111111] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Frequently Asked Questions
              </h2>
              <p className="text-[#6E677D]">
                Got questions? We've got answers.
              </p>
            </div>

            <Card className="max-w-3xl mx-auto rounded-[2rem] border-[#E8E1F4] bg-white/90 shadow-[0_20px_44px_rgba(77,54,42,0.08)] backdrop-blur-sm">
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-[#E8E1F4]">
                      <AccordionTrigger className="text-left text-[#111111] hover:text-[#7D4CE6]">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[#6E677D]">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
