// app/page.tsx
"use client";
import React from "react";

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    features: [
      "Connect 1 Notion workspace",
      "Send up to 5 digests/month",
      "Basic scheduling (daily/weekly)",
      "Email support",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12/mo",
    features: [
      "Connect up to 3 Notion workspaces",
      "Unlimited digests",
      "Advanced scheduling (custom cron)",
      "Digest history & management",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    features: [
      "Unlimited workspaces",
      "Team & org support",
      "Custom integrations",
      "Dedicated onboarding",
      "SLA & compliance",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Hero Section */}
      <section className="w-full flex-1 flex flex-col items-center justify-center py-28 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto text-center">
          {/* Remove logo from hero section, revert to previous */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Automate Notion database digests for your team
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10">
            Digestly connects to your Notion workspace and delivers beautiful,
            scheduled database summaries to your inbox. Minimal setup, maximum
            clarity.
          </p>
          <a
            href="/login"
            className="inline-block px-8 py-4 rounded-lg bg-blue-600 text-white font-bold text-lg shadow hover:bg-blue-700 transition"
          >
            Get Started Free
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="w-full py-24 px-4 border-t border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900">
              {/* Notion logo-inspired icon */}
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-300"
                viewBox="0 0 32 32"
                fill="none"
              >
                <rect
                  x="4"
                  y="4"
                  width="24"
                  height="24"
                  rx="6"
                  fill="currentColor"
                  fillOpacity="0.08"
                />
                <rect
                  x="7"
                  y="7"
                  width="18"
                  height="18"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 13h8M12 17h8M12 21h5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Effortless Notion Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Connect your workspace in seconds with secure OAuth2. No manual
              setup or copy-paste tokens.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900">
              {/* Calendar/clock icon for scheduling */}
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M16 2v4M8 2v4M3 10h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="16"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 14v2l1 1"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Automated, Flexible Scheduling
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Send digests instantly or on a custom schedule—daily, weekly, or
              advanced cron.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900">
              {/* Shield/lock icon for security */}
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="14"
                  r="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 12v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Enterprise-Grade Security
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              All data encrypted, GDPR-ready, and never stored beyond what’s
              needed for delivery.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="w-full py-24 px-4 bg-white dark:bg-gray-950"
      >
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Start free. Upgrade as your needs grow. No hidden fees.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto justify-center">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex-1 rounded-xl border p-8 bg-white dark:bg-gray-900 ${
                tier.highlight
                  ? "border-blue-600 shadow-lg"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
              <div className="text-3xl font-extrabold mb-4">{tier.price}</div>
              <ul className="mb-6 space-y-2 text-gray-700 dark:text-gray-200">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center justify-center">
                    <span className="mr-2 text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href={
                  tier.name === "Enterprise"
                    ? "mailto:sales@digestly.com"
                    : "/login"
                }
                className={`block w-full py-2 rounded-lg font-semibold text-center transition ${
                  tier.highlight
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="w-full py-24 px-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8 text-base">
            <div>
              <h3 className="font-semibold mb-1">Is Digestly secure?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes. We use OAuth2 for Notion, never store your content, and all
                credentials are encrypted. Only you control your data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                Can I use Digestly for my team?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Absolutely! Pro and Enterprise plans support multiple workspaces
                and team features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                What email providers are supported?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Digestly uses Resend by default, but you can request custom
                integrations (SMTP, SendGrid, etc.) on Enterprise.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">How do I get support?</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Email us at{" "}
                <a href="mailto:support@digestly.com" className="underline">
                  support@digestly.com
                </a>{" "}
                or use the in-app chat (coming soon).
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 text-center text-gray-500 text-sm border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        &copy; {new Date().getFullYear()} Digestly. All rights reserved.
      </footer>
    </main>
  );
}
