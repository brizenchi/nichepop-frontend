import { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { DashboardBreadcrumb } from '@/components/dashboard/breadcrumb'

export const metadata: Metadata = {
  title: 'Reddit Marketing - NichePop',
  description: '付费的 Reddit 营销面板，用来找线程、组织回复机会、追踪潜在客户并持续跟进。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-transparent text-[#111111]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(125, 76, 230, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(125, 76, 230, 0.05) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[5%] top-[10%] h-72 w-72 rounded-full bg-[#7D4CE6]/10 blur-3xl" />
        <div className="absolute right-[8%] top-[18%] h-80 w-80 rounded-full bg-[#F3F600]/10 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DashboardBreadcrumb />
          {children}
        </div>
      </main>

      <Footer />
    </div>
  )
}
