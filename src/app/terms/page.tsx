import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using {APP_NAME} ("the Platform"), you agree to be bound by
              these Terms of Service. If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p>
              {APP_NAME} provides a business operating platform that enables organizations
              to manage sales, inventory, purchases, expenses, CRM, staff, branches, and
              reports from a single unified workspace.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate, current, and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>You are responsible for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Platform</li>
              <li>Interfere with or disrupt the integrity of the Platform</li>
              <li>Upload malicious code or content</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">5. Intellectual Property</h2>
            <p>
              The Platform and its original content, features, and functionality are owned
              by {APP_NAME} and are protected by international copyright, trademark, and
              other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">6. Limitation of Liability</h2>
            <p>
              {APP_NAME} shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages arising out of your use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for
              violations of these terms. You may also terminate your account at any time
              by contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users
              of material changes via email or through the Platform. Continued use after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">9. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws
              of the United Republic of Tanzania.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">10. Contact</h2>
            <p>
              For questions about these terms, please contact us at{" "}
              <a href="mailto:legal@enkai.com" className="text-primary underline-offset-4 hover:underline">
                legal@enkai.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
