"use client"

import type React from "react"
import { useState } from "react"
import {
  FileSearch,
  Lightbulb,
  Loader2,
  MessageSquare,
  Users,
  BookmarkCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import LoginDialog from "@/components/LoginDialog"
import { stripeService } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface Tier {
  name: string
  monthlyPrice: number
  yearlyPrice: number
  description: string
  features: Array<{ icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; text: string }>
  cta: string
  popular: boolean
  accent: "zinc" | "indigo" | "amber"
  stripePriceIds?: {
    monthly: string
    yearly: string
  }
  stripeLinks?: {
    monthly: string
    yearly: string
  }
}

const tiers: Tier[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Use the two free tools first: browse opportunities in Ideas DB and run free idea analysis before you pay for execution.",
    features: [
      { icon: Lightbulb, text: "Browse the free Ideas DB" },
      { icon: FileSearch, text: "Run free Idea Analysis" },
      { icon: Users, text: "Review source links and market evidence" },
    ],
    cta: "Free Forever",
    popular: false,
    accent: "zinc",
  },
  {
    name: "Reddit Marketing",
    monthlyPrice: 49,
    yearlyPrice: 490,
    description: "For founders and small teams who are ready to turn Reddit into a repeatable acquisition workflow.",
    features: [
      { icon: MessageSquare, text: "Find relevant Reddit threads to target" },
      { icon: FileSearch, text: "Get reply suggestions and post angles" },
      { icon: Users, text: "Track potential leads from public discussions" },
      { icon: BookmarkCheck, text: "Save your panel and keep follow-up running" },
    ],
    cta: "Unlock Reddit Marketing",
    popular: true,
    accent: "indigo",
    stripePriceIds: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_MONTHLY || "",
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM_YEARLY || "",
    },
    stripeLinks: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_LINK_PREMIUM_MONTHLY || "",
      yearly: process.env.NEXT_PUBLIC_STRIPE_LINK_PREMIUM_YEARLY || "",
    },
  },
]

export function PricingCards() {
  const [isYearly, setIsYearly] = useState(false)
  const { isAuthenticated } = useAuth()
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processingTier, setProcessingTier] = useState<string | null>(null)

  const handleUpgrade = async (tier: Tier) => {
    if (tier.name === "Free") {
      return
    }

    if (!isAuthenticated) {
      setLoginDialogOpen(true)
      return
    }

    const priceId = isYearly ? tier.stripePriceIds?.yearly : tier.stripePriceIds?.monthly

    if (!priceId) {
      if (tier.stripeLinks) {
        const link = isYearly ? tier.stripeLinks.yearly : tier.stripeLinks.monthly
        window.location.href = link
      }
      return
    }

    try {
      setLoading(true)
      setProcessingTier(tier.name)

      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${baseUrl}/pricing`

      const session = await stripeService.createCheckout({
        price_id: priceId,
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
      })

      if (session.url) {
        window.location.href = session.url
      } else {
        throw new Error("No checkout URL returned from server")
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error)
      toast({
        title: "Payment Error",
        description: "Failed to start payment process. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
      setProcessingTier(null)
    }
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-center gap-4">
        <span className={cn("text-sm font-medium transition-colors", !isYearly ? "text-[#111111]" : "text-[#6E677D]")}>
          Monthly
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
            isYearly ? "border-[#7D4CE6] bg-[#7D4CE6]" : "border-[#D8CCF2] bg-white",
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
              isYearly ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
        <span className={cn("text-sm font-medium transition-colors", isYearly ? "text-[#111111]" : "text-[#6E677D]")}>
          Yearly <span className="text-[#43B86E]">(Save 17%)</span>
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {tiers.map((tier) => {
          const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice
          const originalPrice = isYearly ? tier.monthlyPrice * 12 : tier.monthlyPrice
          const period = isYearly ? "/year" : "/month"
          const showDiscount = isYearly && tier.yearlyPrice > 0

          const accentClasses = {
            zinc: "text-[#111111]",
            indigo: "text-[#7D4CE6]",
            amber: "text-[#D49A00]",
          }

          const buttonClasses = {
            zinc: "bg-[#111111] hover:bg-[#111111]/92 text-white",
            indigo: "bg-[#7D4CE6] hover:bg-[#7043D6] text-white",
            amber: "bg-[#D49A00] hover:bg-[#BC8B00] text-white",
          }

          const surfaceClasses = {
            zinc: "bg-white",
            indigo: "bg-[#F3EDFF]",
            amber: "bg-[#FFF7D8]",
          }

          return (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-3xl border p-6 shadow-[0_18px_40px_rgba(77,54,42,0.06)] transition-all duration-300",
                surfaceClasses[tier.accent],
                tier.popular
                  ? "scale-[1.02] border-[#7D4CE6] shadow-lg shadow-[#7D4CE6]/15"
                  : "border-[#E8E1F4] hover:border-[#D8CCF2]",
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#7D4CE6] px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              {showDiscount && (
                <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
                  <span className="rounded-full bg-[#43B86E]/10 px-3 py-1.5 text-sm font-bold text-[#43B86E]">
                    Save 17%
                  </span>
                  <span className="text-xs text-[#6E677D] line-through">${originalPrice.toFixed(2)}</span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#111111]">{tier.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className={cn("font-mono text-4xl font-bold", accentClasses[tier.accent])}>
                    ${price.toFixed(price === 0 ? 0 : 2)}
                  </span>
                  <span className="ml-1 text-sm text-[#6E677D]">{period}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#6E677D]">{tier.description}</p>
              </div>

              <ul className="mb-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3 text-sm text-[#6E677D]">
                    <feature.icon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        tier.accent === "zinc" && "text-[#111111]",
                        tier.accent === "indigo" && "text-[#7D4CE6]",
                        tier.accent === "amber" && "text-[#D49A00]",
                      )}
                    />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(tier)}
                disabled={tier.name === "Free" || loading}
                className={cn(
                  "w-full font-semibold transition-all duration-200",
                  buttonClasses[tier.accent],
                  tier.name === "Free" && "cursor-default opacity-75",
                )}
              >
                {loading && processingTier === tier.name ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  tier.cta
                )}
              </Button>
            </div>
          )
        })}
      </div>
      <LoginDialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)} />
    </>
  )
}
