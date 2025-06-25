import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Digestly",
  description:
    "Learn how Digestly handles your data and protects your privacy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-slate max-w-none">
        <p className="text-gray-500 mb-8">Last updated: June 25, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p>
            At Digestly (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or
            &ldquo;us&rdquo;), we respect your privacy and are committed to
            protecting your personal data. This privacy policy explains how we
            collect, use, and safeguard your information when you use our
            application that delivers email digests from your Notion databases.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Information We Collect
          </h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">
              <strong>Account Information:</strong> Email address and
              authentication information when you sign up.
            </li>
            <li className="mb-2">
              <strong>Notion Integration Data:</strong> When you connect
              Digestly to your Notion account, we receive an access token and
              permissions to access the specific Notion databases you select.
            </li>
            <li className="mb-2">
              <strong>Digest Settings:</strong> Your preferences for digest
              frequency, timing, and email delivery.
            </li>
            <li className="mb-2">
              <strong>Usage Data:</strong> Information about how you interact
              with our service, including log data and performance metrics.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            How We Use Your Information
          </h2>
          <p>We use the collected information for various purposes:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">To provide and maintain our service</li>
            <li className="mb-2">To notify you about changes to our service</li>
            <li className="mb-2">
              To allow you to participate in interactive features of our service
            </li>
            <li className="mb-2">To provide customer support</li>
            <li className="mb-2">
              To gather analysis or valuable information so that we can improve
              our service
            </li>
            <li className="mb-2">To monitor the usage of our service</li>
            <li className="mb-2">
              To detect, prevent and address technical issues
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Legal Basis for Processing (EU Users)
          </h2>
          <p>
            If you are from the European Economic Area (EEA), our legal basis
            for collecting and using your personal information depends on the
            data concerned and the specific context in which we collect it:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">We need to perform a contract with you</li>
            <li className="mb-2">You have given us permission to do so</li>
            <li className="mb-2">
              Processing is in our legitimate interests and not overridden by
              your rights
            </li>
            <li className="mb-2">To comply with legal obligations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Data Storage and Security
          </h2>
          <p>
            We use industry-standard security measures to protect your data.
            Your data is stored in secure databases and we implement appropriate
            safeguards to prevent unauthorized access. We retain your personal
            data only for as long as necessary to fulfill the purposes for which
            we collected it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Data Sharing and Third Parties
          </h2>
          <p>
            We do not sell your personal data to third parties. We may share
            your information with:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">
              <strong>Service Providers:</strong> We may employ third-party
              companies to facilitate our service, provide the service on our
              behalf, or assist us in analyzing how our service is used.
            </li>
            <li className="mb-2">
              <strong>Notion:</strong> We integrate with Notion to access your
              databases with your permission.
            </li>
            <li className="mb-2">
              <strong>Legal Requirements:</strong> We may disclose your personal
              data if required by law or in response to valid requests by public
              authorities.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Your Data Protection Rights
          </h2>
          <p>
            If you are a resident of the European Economic Area (EEA), you have
            certain data protection rights. We aim to take reasonable steps to
            allow you to correct, amend, delete, or limit the use of your
            Personal Data.
          </p>
          <p>You have the following rights:</p>
          <ul className="list-disc pl-6 mb-4">
            <li className="mb-2">
              The right to access, update or delete your personal information
            </li>
            <li className="mb-2">The right of rectification</li>
            <li className="mb-2">The right to object to processing</li>
            <li className="mb-2">The right of restriction</li>
            <li className="mb-2">The right to data portability</li>
            <li className="mb-2">The right to withdraw consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Cookies Policy</h2>
          <p>
            We use cookies and similar tracking technologies to track activity
            on our service and store certain information. Cookies are files with
            a small amount of data that may include an anonymous unique
            identifier.
          </p>
          <p>
            You can instruct your browser to refuse all cookies or to indicate
            when a cookie is being sent. However, if you do not accept cookies,
            you may not be able to use some portions of our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Changes to This Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the &ldquo;Last updated&rdquo; date.
          </p>
          <p>
            You are advised to review this Privacy Policy periodically for any
            changes. Changes to this Privacy Policy are effective when they are
            posted on this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at{" "}
            <a
              href="mailto:knockanapp@gmail.com"
              className="text-blue-700 hover:underline"
            >
              knockanapp@gmail.com
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200">
        <Link href="/" className="text-blue-700 hover:underline">
          &larr; Return to Home
        </Link>
      </div>
    </div>
  );
}
