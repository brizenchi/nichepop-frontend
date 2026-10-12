import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FileText } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read NichePop's Terms of Service to understand the rules and regulations governing the use of our keyword research platform.",
  alternates: {
    canonical: "/terms",
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7D4CE6] to-[#1479D6]">
                <FileText className="h-8 w-8 text-[#111111]" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#111111] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Terms of Service
            </h1>
            <p className="text-lg text-[#6E677D]">
              Last updated: January 1, 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="bg-white/90 border border-[#E8E1F4] rounded-xl p-8 space-y-8">

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">1. Agreement to Terms</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  By accessing or using NichePop ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">2. Description of Service</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  NichePop is a keyword research and analysis platform that provides:
                </p>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside mt-2">
                  <li>Real-time keyword trend analysis</li>
                  <li>Competition and opportunity scoring</li>
                  <li>Search volume and CPC data</li>
                  <li>SERP analysis and insights</li>
                  <li>Profit estimation tools</li>
                  <li>AI-powered keyword recommendations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">3. User Accounts</h2>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">3.1 Account Creation</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  To use certain features of the Service, you must create an account. You agree to:
                </p>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside mt-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">3.2 Account Eligibility</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that you meet this requirement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">4. Subscription and Payment</h2>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">4.1 Pricing</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  We offer various subscription plans with different features and pricing. Current pricing is available on our Pricing page. We reserve the right to modify our pricing with 30 days' notice to existing subscribers.
                </p>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">4.2 Billing</h3>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside">
                  <li>Subscriptions are billed in advance on a monthly or annual basis</li>
                  <li>Payment is processed through Stripe, our secure payment processor</li>
                  <li>You authorize us to charge your payment method for all fees</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>Failed payments may result in service suspension</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">4.3 Cancellation</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period. You will retain access to paid features until the end of the billing period.
                </p>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">4.4 Free Trial</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  We may offer a free trial period. At the end of the trial, you will be charged unless you cancel before the trial ends. We reserve the right to modify or cancel free trial offers at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">5. Acceptable Use</h2>
                <p className="text-[#6E677D] leading-relaxed mb-4">
                  You agree not to:
                </p>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside">
                  <li>Use the Service for any illegal purpose or in violation of any laws</li>
                  <li>Violate or infringe upon the rights of others</li>
                  <li>Transmit any viruses, malware, or harmful code</li>
                  <li>Attempt to gain unauthorized access to the Service</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use automated systems to access the Service without permission</li>
                  <li>Scrape, copy, or download data in bulk</li>
                  <li>Resell or redistribute the Service or data</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                  <li>Remove or modify any proprietary notices</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">6. Intellectual Property</h2>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">6.1 Our Rights</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  The Service and its original content, features, and functionality are owned by NichePop and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">6.2 Your Rights</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  You retain all rights to any content you submit, post, or display on or through the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display such content solely for providing the Service.
                </p>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">6.3 Data Usage</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  The keyword data, analytics, and insights provided by the Service are for your internal business use only. You may not redistribute, resell, or publicly display this data without our written permission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">7. Data Accuracy and Limitations</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  While we strive to provide accurate and up-to-date information:
                </p>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside mt-2">
                  <li>Data is provided "as is" without warranties of any kind</li>
                  <li>We do not guarantee the accuracy, completeness, or timeliness of data</li>
                  <li>Third-party data sources may have their own limitations</li>
                  <li>You should verify critical information independently</li>
                  <li>We are not responsible for decisions made based on our data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">8. Service Availability</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  We strive to maintain high availability but do not guarantee uninterrupted access. We may:
                </p>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside mt-2">
                  <li>Perform scheduled maintenance with advance notice</li>
                  <li>Experience unexpected downtime or technical issues</li>
                  <li>Modify or discontinue features with notice</li>
                  <li>Implement usage limits or rate limiting</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">9. Disclaimer of Warranties</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">10. Limitation of Liability</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, NICHEPOP SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">11. Indemnification</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  You agree to indemnify, defend, and hold harmless NichePop and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses arising from your use of the Service or violation of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">12. Termination</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">13. Governing Law</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which NichePop operates, without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">14. Changes to Terms</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">15. Contact Information</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  If you have any questions about these Terms, please contact us:
                </p>
                <ul className="text-[#6E677D] space-y-2 mt-4">
                  <li>Email: <a href="mailto:support@nichepop.app" className="text-[#7D4CE6] hover:underline">support@nichepop.app</a></li>
                  <li>Support: <a href="mailto:support@nichepop.app" className="text-[#7D4CE6] hover:underline">support@nichepop.app</a></li>
                </ul>
              </section>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
