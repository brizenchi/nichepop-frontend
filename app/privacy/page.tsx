import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Shield } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how NichePop collects, uses, and protects your personal information. Our commitment to your privacy and data security.",
  alternates: {
    canonical: "/privacy",
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7D4CE6] to-[#1479D6]">
                <Shield className="h-8 w-8 text-[#111111]" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-[#111111] mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Privacy Policy
            </h1>
            <p className="text-lg text-[#6E677D]">
              Last updated: January 1, 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div className="bg-white/90 border border-[#E8E1F4] rounded-xl p-8 space-y-8">

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">1. Introduction</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  Welcome to NichePop ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our keyword research platform and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">2. Information We Collect</h2>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">2.1 Information You Provide</h3>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside">
                  <li>Account information (email address, name, password)</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Profile information and preferences</li>
                  <li>Communications with our support team</li>
                  <li>Feedback and survey responses</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">2.2 Automatically Collected Information</h3>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside">
                  <li>Usage data (features used, keywords searched, time spent)</li>
                  <li>Device information (browser type, operating system, IP address)</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Log data (access times, pages viewed, errors)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">3. How We Use Your Information</h2>
                <p className="text-[#6E677D] leading-relaxed mb-4">
                  We use the collected information for the following purposes:
                </p>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send administrative information, updates, and security alerts</li>
                  <li>Respond to your comments, questions, and customer service requests</li>
                  <li>Analyze usage patterns to improve user experience</li>
                  <li>Detect, prevent, and address technical issues and fraud</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">4. Data Sharing and Disclosure</h2>
                <p className="text-[#6E677D] leading-relaxed mb-4">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">4.1 Service Providers</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  We work with third-party service providers who perform services on our behalf, including:
                </p>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside mt-2">
                  <li>Payment processing (Stripe)</li>
                  <li>Analytics services (Google Analytics, Vercel Analytics)</li>
                  <li>Email service providers</li>
                  <li>Cloud hosting providers</li>
                  <li>Customer support tools</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">4.2 Legal Requirements</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  We may disclose your information if required by law or in response to valid requests by public authorities.
                </p>

                <h3 className="text-xl font-semibold text-[#111111] mb-3 mt-6">4.3 Business Transfers</h3>
                <p className="text-[#6E677D] leading-relaxed">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">5. Data Security</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal information, including:
                </p>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside mt-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication mechanisms</li>
                  <li>Secure payment processing through PCI-compliant providers</li>
                  <li>Regular backups and disaster recovery procedures</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">6. Your Rights and Choices</h2>
                <p className="text-[#6E677D] leading-relaxed mb-4">
                  Depending on your location, you may have the following rights:
                </p>
                <ul className="text-[#6E677D] space-y-2 list-disc list-inside">
                  <li><strong className="text-[#111111]">Access:</strong> Request access to your personal information</li>
                  <li><strong className="text-[#111111]">Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong className="text-[#111111]">Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong className="text-[#111111]">Portability:</strong> Request a copy of your data in a portable format</li>
                  <li><strong className="text-[#111111]">Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong className="text-[#111111]">Restriction:</strong> Request restriction of processing</li>
                  <li><strong className="text-[#111111]">Objection:</strong> Object to certain types of processing</li>
                </ul>
                <p className="text-[#6E677D] leading-relaxed mt-4">
                  To exercise these rights, please contact us at <a href="mailto:support@nichepop.app" className="text-[#7D4CE6] hover:underline">support@nichepop.app</a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">7. Cookies and Tracking Technologies</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">8. Data Retention</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">9. International Data Transfers</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. We ensure appropriate safeguards are in place for such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">10. Children's Privacy</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-[#111111] mb-4">12. Contact Us</h2>
                <p className="text-[#6E677D] leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us:
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
