"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  Clock,
  MapPin,
  Phone,
  HelpCircle,
} from "lucide-react";

// ── Shared Types ─────────────────────────────────────────────────────────────

interface CompliancePageProps {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  displayOrder: number;
}

// ── Shared Header Component ──────────────────────────────────────────────────

function PageHeader({
  title,
  onNavigate,
}: {
  title: string;
  onNavigate: (view: string) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] min-w-[44px] gap-1.5"
          onClick={() => onNavigate("home")}
          aria-label="Back to Home"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
    </header>
  );
}

// ── Privacy Policy Page ──────────────────────────────────────────────────────

export function PrivacyPolicyPage({ onNavigate }: CompliancePageProps) {
  return (
    <div className="bg-white">
      <PageHeader title="Privacy Policy" onNavigate={onNavigate} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="mb-8 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <section className="space-y-6 text-sm leading-relaxed text-foreground/90">
            <div>
              <h2 className="mb-3 text-xl font-semibold">1. Introduction</h2>
              <p>
                Indicore Originals (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting
                your personal information and your right to privacy. This Privacy Policy explains
                how we collect, use, disclose, and safeguard your information when you visit our
                website and purchase our products. This policy complies with the Digital Personal
                Data Protection Act, 2023 (DPDP Act 2023) of India.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">2. Information We Collect</h2>
              <h3 className="mb-2 text-base font-medium">Personal Data</h3>
              <p className="mb-3">
                When you place an order, create an account, or contact us, we may collect:
              </p>
              <ul className="mb-4 list-disc space-y-1.5 pl-6">
                <li>Full name and contact details (email address, phone number)</li>
                <li>Shipping and billing addresses</li>
                <li>Order history and payment information</li>
                <li>Account credentials (hashed and securely stored)</li>
              </ul>

              <h3 className="mb-2 text-base font-medium">Automatically Collected Data</h3>
              <p className="mb-3">When you browse our website, we may automatically collect:</p>
              <ul className="mb-4 list-disc space-y-1.5 pl-6">
                <li>IP address, browser type, and device information</li>
                <li>Pages visited, time spent, and browsing patterns</li>
                <li>Referral source and search queries</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">3. How We Use Your Information</h2>
              <p className="mb-3">We use your personal data for the following purposes:</p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Processing and fulfilling your orders</li>
                <li>Sending order confirmations, shipping updates, and delivery notifications</li>
                <li>Providing customer support and responding to inquiries</li>
                <li>Improving our website, products, and services</li>
                <li>Sending promotional communications (only with your consent)</li>
                <li>Complying with legal obligations</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">4. Cookies and Tracking Technologies</h2>
              <p className="mb-3">
                We use cookies and similar technologies to enhance your browsing experience.
                These include:
              </p>
              <ul className="mb-3 list-disc space-y-1.5 pl-6">
                <li>
                  <strong>Essential Cookies:</strong> Required for the website to function properly
                  (e.g., session management, cart persistence).
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how visitors interact
                  with our website.
                </li>
                <li>
                  <strong>Marketing Cookies:</strong> Used to deliver relevant advertisements
                  (placed only with your consent).
                </li>
              </ul>
              <p>
                You can manage your cookie preferences through your browser settings. Disabling
                certain cookies may affect website functionality.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">5. DPDP Act 2023 Compliance</h2>
              <p className="mb-3">
                In accordance with the Digital Personal Data Protection Act, 2023:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>We collect and process personal data only for lawful, specified purposes.</li>
                <li>We limit data collection to what is necessary for the stated purpose.</li>
                <li>We implement reasonable security safeguards to protect your data.</li>
                <li>We do not retain personal data beyond the period necessary for the purpose.</li>
                <li>We appoint a Data Protection Officer (DPO) who can be reached at the contact information below.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">6. Your Rights</h2>
              <p className="mb-3">Under applicable data protection laws, you have the right to:</p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>
                  <strong>Access:</strong> Request a copy of the personal data we hold about you.
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of any inaccurate or incomplete
                  personal data.
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal data, subject to
                  legal retention requirements.
                </li>
                <li>
                  <strong>Withdraw Consent:</strong> Withdraw your consent for marketing
                  communications at any time.
                </li>
                <li>
                  <strong>Grievance Redressal:</strong> Lodge a complaint with the Data Protection
                  Board of India if you are unsatisfied with our response.
                </li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us using the details provided below.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">7. Data Retention</h2>
              <p className="mb-3">
                We retain your personal data only for as long as necessary to fulfill the purposes
                for which it was collected, including:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Order records are retained for up to 3 years for tax and legal compliance.</li>
                <li>Account data is retained while your account is active.</li>
                <li>Marketing data is retained until you withdraw consent.</li>
                <li>Server logs are retained for up to 90 days for security purposes.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">8. Data Sharing</h2>
              <p className="mb-3">
                We do not sell your personal data to third parties. We may share your data with:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Shipping and logistics partners (for order delivery)</li>
                <li>Payment processors (for secure payment handling)</li>
                <li>Legal authorities (when required by law)</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">9. Security</h2>
              <p>
                We implement industry-standard security measures including SSL encryption, secure
                password hashing, and regular security audits to protect your personal data.
                However, no method of transmission over the Internet is 100% secure, and we cannot
                guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your data
                rights, please contact us at:
              </p>
              <ul className="mt-3 list-none space-y-1 pl-0">
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span>originalsindicore@gmail.com</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ── Terms & Conditions Page ──────────────────────────────────────────────────

export function TermsPage({ onNavigate }: CompliancePageProps) {
  return (
    <div className="bg-white">
      <PageHeader title="Terms & Conditions" onNavigate={onNavigate} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="mb-8 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <section className="space-y-6 text-sm leading-relaxed text-foreground/90">
            <div>
              <h2 className="mb-3 text-xl font-semibold">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Indicore Originals website and placing orders, you
                acknowledge that you have read, understood, and agree to be bound by these Terms
                &amp; Conditions. If you do not agree with any part of these terms, you should not
                use our website or services.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">2. Products</h2>
              <p className="mb-3">
                All products listed on our website are subject to availability. We strive to
                display accurate product descriptions, images, and pricing; however:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Product colors may vary slightly due to screen settings and photography lighting.</li>
                <li>We reserve the right to discontinue any product without prior notice.</li>
                <li>Product dimensions and weights are approximate and may vary slightly.</li>
                <li>We reserve the right to limit quantities per order.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">3. Pricing</h2>
              <p className="mb-3">
                All prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes
                unless stated otherwise:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Prices are subject to change without prior notice.</li>
                <li>Promotional offers and discounts are time-limited and may be withdrawn at any time.</li>
                <li>In case of a pricing error, we reserve the right to cancel the affected orders and issue a full refund.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">4. Cash on Delivery (COD) Payments</h2>
              <p className="mb-3">
                We offer Cash on Delivery as a payment option for select locations:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>COD orders may be subject to a nominal convenience fee.</li>
                <li>Exact change is appreciated but not mandatory.</li>
                <li>COD orders that are refused at the time of delivery may incur return shipping charges deducted from the refund amount.</li>
                <li>We reserve the right to reject COD orders based on order value, delivery location, or order history.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">5. Order Placement &amp; Acceptance</h2>
              <p className="mb-3">
                Placing an order constitutes an offer to purchase. An order is confirmed and a
                binding contract is formed only when:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>We send you an order confirmation via email or SMS.</li>
                <li>Your payment has been successfully processed (for prepaid orders).</li>
              </ul>
              <p className="mt-3">
                We reserve the right to refuse or cancel any order due to product unavailability,
                pricing errors, suspected fraud, or any other reason at our discretion.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">6. Order Cancellation</h2>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>
                  <strong>Before shipment:</strong> You may cancel your order by contacting us
                  via WhatsApp or email. A full refund will be processed within 5-7 business days.
                </li>
                <li>
                  <strong>After shipment:</strong> Orders that have already been shipped cannot
                  be cancelled. Please refer to our Return Policy for post-delivery options.
                </li>
                <li>We reserve the right to cancel orders and issue refunds at our discretion.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">7. Shipping &amp; Delivery</h2>
              <p className="mb-3">
                Delivery timelines are estimates and not guaranteed:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Standard delivery typically takes 5-10 business days, depending on location.</li>
                <li>Delays may occur due to courier partner issues, natural calamities, or other unforeseen circumstances.</li>
                <li>We are not liable for delays caused by factors beyond our control.</li>
                <li>Risk of loss and title for items purchased pass to you upon delivery to the shipping carrier.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">8. Intellectual Property</h2>
              <p className="mb-3">
                All content on this website, including but not limited to text, graphics, logos,
                images, product descriptions, and software, is the property of Indicore Originals
                or its content suppliers and is protected by Indian and international intellectual
                property laws.
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>You may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent.</li>
                <li>The Indicore Originals name, logo, and all related marks are trademarked.</li>
                <li>Unauthorized use of any intellectual property may result in legal action.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">9. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-6">
                <li>Use the website for any unlawful purpose.</li>
                <li>Attempt to gain unauthorized access to any part of the website or its systems.</li>
                <li>Interfere with or disrupt the website&apos;s functionality.</li>
                <li>Submit false orders or provide misleading information.</li>
                <li>Use automated systems (bots, scrapers) to access the website.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">10. Limitation of Liability</h2>
              <p className="mb-3">
                To the maximum extent permitted by applicable law:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Indicore Originals shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the website or products.</li>
                <li>Our total liability for any claim shall not exceed the amount you paid for the product or service in question.</li>
                <li>We do not warrant that the website will be available at all times, error-free, or free of viruses.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">11. Governing Law &amp; Dispute Resolution</h2>
              <p className="mb-3">
                These Terms &amp; Conditions are governed by the laws of India. Any disputes
                arising from these terms or your use of the website shall be subject to the
                exclusive jurisdiction of the courts in India.
              </p>
              <p>
                We encourage you to contact us first to resolve any disputes before pursuing legal
                action.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">12. Changes to Terms</h2>
              <p>
                We reserve the right to update or modify these Terms &amp; Conditions at any time.
                Changes will be effective immediately upon posting on the website. Your continued
                use of the website after changes are posted constitutes acceptance of the revised
                terms.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ── Return Policy Page ───────────────────────────────────────────────────────

export function ReturnPolicyPage({ onNavigate }: CompliancePageProps) {
  return (
    <div className="bg-white">
      <PageHeader title="Return & Refund Policy" onNavigate={onNavigate} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="mb-8 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <section className="space-y-6 text-sm leading-relaxed text-foreground/90">
            <div>
              <h2 className="mb-3 text-xl font-semibold">1. Return Window</h2>
              <p className="mb-3">
                We offer a <strong>7-day return window</strong> from the date of delivery. If you
                are not satisfied with your purchase, you may request a return within this period
                subject to the conditions listed below.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">2. Return Conditions</h2>
              <p className="mb-3">To be eligible for a return, the product must:</p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Be unused, unwashed, and in its original condition.</li>
                <li>Have all original tags, labels, and packaging intact.</li>
                <li>Not have been altered, customized, or personalized.</li>
                <li>Be accompanied by the original invoice or order confirmation.</li>
                <li>Not be damaged due to customer negligence or improper use.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">3. COD Order Returns</h2>
              <p className="mb-3">
                For orders placed via Cash on Delivery (COD):
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Return shipping charges (if applicable) will be deducted from the refund amount.</li>
                <li>Refunds will be processed to your bank account via NEFT/IMPS. You will need to provide your bank account details.</li>
                <li>If a COD order was refused at delivery and later a return is requested, additional handling charges may apply.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">4. Refund Process</h2>
              <p className="mb-3">Once your return request is approved:</p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>
                  <strong>Prepaid orders:</strong> Refund will be processed to the original
                  payment method within 5-7 business days after we receive and inspect the
                  returned product.
                </li>
                <li>
                  <strong>COD orders:</strong> Refund will be processed to your bank account
                  within 7-10 business days.
                </li>
                <li>You will receive a confirmation email once the refund has been initiated.</li>
                <li>Bank processing times may vary and are beyond our control.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">5. Non-Returnable Items</h2>
              <p className="mb-3">The following items are not eligible for return or exchange:</p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Products that have been used, washed, or worn.</li>
                <li>Items without original tags, labels, or packaging.</li>
                <li>Customized or personalized products.</li>
                <li>Items purchased during clearance sales or final sale events (unless defective).</li>
                <li>Perishable goods or items with a limited shelf life.</li>
                <li>Products damaged due to customer negligence.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">6. Damaged or Defective Products</h2>
              <p className="mb-3">
                If you receive a damaged, defective, or incorrect product:
              </p>
              <ul className="list-disc space-y-1.5 pl-6">
                <li>Contact us within 48 hours of delivery with photos of the damage/defect.</li>
                <li>We will arrange a reverse pickup at no additional cost to you.</li>
                <li>You may choose between a full refund or a replacement, subject to availability.</li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">7. How to Initiate a Return</h2>
              <p className="mb-3">To request a return, please follow these steps:</p>
              <ol className="list-decimal space-y-1.5 pl-6">
                <li>Contact us via WhatsApp or email with your order number and reason for return.</li>
                <li>Our team will review your request and respond within 24-48 hours.</li>
                <li>If approved, we will share return shipping instructions.</li>
                <li>Pack the product securely in its original packaging and ship it back.</li>
                <li>Once received and inspected, your refund will be processed.</li>
              </ol>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">8. Exchanges</h2>
              <p>
                We currently do not offer direct exchanges. If you would like a different size,
                color, or product, please initiate a return and place a new order separately.
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-xl font-semibold">9. Contact for Returns</h2>
              <p className="mb-3">
                For all return and refund inquiries, please reach out to us:
              </p>
              <ul className="list-none space-y-1.5 pl-0">
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span>originalsindicore@gmail.com</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ── About Us Page ────────────────────────────────────────────────────────────

export function AboutPage({ onNavigate }: CompliancePageProps) {
  return (
    <div className="bg-white">
      <PageHeader title="About Us" onNavigate={onNavigate} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <section className="space-y-10">
            {/* Brand Story */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold sm:text-3xl">Our Story</h2>
              <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
                <p>
                  Indicore Originals was born from a simple belief: that every product should
                  tell a story. Founded with a passion for quality craftsmanship and authentic
                  design, we set out to create a brand that celebrates originality while staying
                  true to its roots.
                </p>
                <p>
                  What started as a small venture has grown into a curated collection of
                  products that we&apos;re genuinely proud of. Each item in our catalog is
                  carefully selected and quality-checked to ensure it meets the high standards
                  our customers deserve.
                </p>
                <p>
                  We believe that great products don&apos;t need to come with a premium price tag.
                  By working directly with makers and cutting out unnecessary middlemen, we bring
                  you original, high-quality products at honest prices.
                </p>
              </div>
            </div>

            {/* Mission */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold sm:text-3xl">Our Mission</h2>
              <p className="text-sm leading-relaxed text-foreground/90">
                To make original, thoughtfully crafted products accessible to everyone. We
                strive to build a shopping experience that is transparent, enjoyable, and
                trustworthy — where every purchase feels good, from browsing to unboxing.
              </p>
            </div>

            {/* Values */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold sm:text-3xl">Our Values</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {[
                  {
                    title: "Quality First",
                    description:
                      "Every product undergoes rigorous quality checks. We never compromise on materials or craftsmanship.",
                  },
                  {
                    title: "Honest Pricing",
                    description:
                      "Fair and transparent pricing with no hidden costs. What you see is what you pay.",
                  },
                  {
                    title: "Customer Obsessed",
                    description:
                      "Your satisfaction drives every decision we make. We listen, respond, and continuously improve.",
                  },
                  {
                    title: "Authenticity",
                    description:
                      "We celebrate originality. Our products are genuine, unique, and crafted with care.",
                  },
                ].map((value) => (
                  <div
                    key={value.title}
                    className="rounded-lg border bg-muted/30 p-5"
                  >
                    <h3 className="mb-1.5 font-semibold">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* What Makes Us Unique */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold sm:text-3xl">
                What Makes Us Unique
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    <strong>Curated Selection:</strong> We don&apos;t list thousands of products.
                    Every item is handpicked for its quality, design, and value.
                  </li>
                  <li>
                    <strong>Direct from Makers:</strong> We work closely with artisans and
                    manufacturers to bring you the best without markups.
                  </li>
                  <li>
                    <strong>Indian-Made Pride:</strong> We proudly support local craftsmanship
                    and showcase the best of Indian manufacturing.
                  </li>
                  <li>
                    <strong>Simple Shopping:</strong> No cluttered interfaces, no confusing
                    checkout flows. Just a clean, straightforward shopping experience.
                  </li>
                  <li>
                    <strong>After-Sale Care:</strong> Our relationship doesn&apos;t end at
                    delivery. We&apos;re here to help with returns, queries, and everything in
                    between.
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-xl bg-neutral-900 p-8 text-center text-white sm:p-10">
              <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                Ready to Explore?
              </h2>
              <p className="mx-auto mb-5 max-w-md text-sm text-neutral-300">
                Browse our curated collection and discover products that are made with care,
                designed with purpose, and priced with honesty.
              </p>
              <Button
                size="lg"
                className="min-h-[44px] font-semibold"
                onClick={() => onNavigate("shop")}
              >
                Shop Now
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ── Contact Page ─────────────────────────────────────────────────────────────

export function ContactPage({ onNavigate }: CompliancePageProps) {
  return (
    <div className="bg-white">
      <PageHeader title="Contact Us" onNavigate={onNavigate} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <section className="space-y-10">
            {/* Intro */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold sm:text-3xl">Get in Touch</h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                We&apos;d love to hear from you. Whether you have a question about our products,
                need help with an order, or just want to say hello — reach out using any of the
                channels below.
              </p>
            </div>

            {/* Order inquiry note */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-medium text-amber-900">
                For order inquiries, please use Track Order or contact us via WhatsApp for the
                fastest response.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 min-h-[44px] gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => onNavigate("track-order")}
              >
                Track Your Order
              </Button>
            </div>

            {/* Contact methods grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Email */}
              <div className="rounded-lg border p-6">
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="size-5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">Email</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  For general inquiries and support
                </p>
                <a
                  href="mailto:support@indicoreoriginals.com"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  originalsindicore@gmail.com
                </a>
              </div>
            </div>

              {/* WhatsApp */}
              <div className="rounded-lg border p-6">
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="size-5 text-primary" />
                </div>

              {/* Instagram */}
              <div className="rounded-lg border p-6">
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Instagram className="size-5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">Instagram</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Follow us for updates, new arrivals, and behind-the-scenes content
                </p>
                <a
                  href="https://instagram.com/indicoreoriginals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  @indicoreoriginals
                </a>
              </div>

              {/* Facebook */}
              <div className="rounded-lg border p-6">
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10">
                  <Facebook className="size-5 text-primary" />
                </div>
                <h3 className="mb-1 font-semibold">Facebook</h3>
                <p className="mb-2 text-sm text-muted-foreground">
                  Like our page for announcements and offers
                </p>
                <a
                  href="https://facebook.com/indicoreoriginals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Indicore Originals
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ── FAQ Page ─────────────────────────────────────────────────────────────────

export function FaqPage({ onNavigate }: CompliancePageProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const res = await fetch("/api/faq");
        if (!res.ok) {
          throw new Error("Failed to load FAQs");
        }
        const data = await res.json();
        const items = Array.isArray(data) ? data : [];
        // Sort by display order
        items.sort((a: FaqItem, b: FaqItem) => a.displayOrder - b.displayOrder);
        setFaqs(items);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchFaqs();
  }, []);

  return (
    <div className="bg-white">
      <PageHeader title="Frequently Asked Questions" onNavigate={onNavigate} />
      <main className="min-h-[calc(100vh-3.5rem)]">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          {/* Loading state */}
          {loading && (
            <div className="space-y-4">
              <div className="mb-8 text-center">
                <Skeleton className="mx-auto mb-2 h-8 w-64" />
                <Skeleton className="mx-auto h-4 w-96 max-w-full" />
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="py-16 text-center">
              <HelpCircle className="mx-auto mb-4 size-12 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                Unable to load FAQs right now.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                className="mt-4 min-h-[44px]"
                onClick={() => onNavigate("contact")}
              >
                Contact Us Instead
              </Button>
            </div>
          )}

          {/* Loaded state */}
          {!loading && !error && (
            <section className="space-y-10">
              {/* Intro */}
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold sm:text-3xl">
                  How Can We Help?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Find answers to commonly asked questions about our products, orders,
                  shipping, and more.
                </p>
              </div>

              {/* FAQ Accordion */}
              {faqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                      <AccordionTrigger className="text-left text-sm font-medium md:text-base">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="py-16 text-center">
                  <HelpCircle className="mx-auto mb-4 size-12 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No FAQs available yet.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    We&apos;re working on adding them soon.
                  </p>
                </div>
              )}

              {/* Still have questions? */}
              <div className="rounded-xl bg-neutral-900 p-8 text-center text-white sm:p-10">
                <h3 className="mb-2 text-xl font-bold">Still Have Questions?</h3>
                <p className="mx-auto mb-5 max-w-md text-sm text-neutral-300">
                  Can&apos;t find what you&apos;re looking for? We&apos;re happy to help.
                  Reach out to us directly and we&apos;ll get back to you as soon as we can.
                </p>
                <Button
                  size="lg"
                  className="min-h-[44px] font-semibold"
                  onClick={() => onNavigate("contact")}
                >
                  Contact Us
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}