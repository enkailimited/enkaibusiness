import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">1. Introduction</h2>
            <p>
              {APP_NAME} ("we," "our," or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">2. Information We Collect</h2>
            <h3 className="mb-2 font-medium text-foreground">Personal Data</h3>
            <p>
              We may collect personally identifiable information such as your name, email
              address, phone number, and business details when you register for an account
              or use our services.
            </p>
            <h3 className="mt-4 mb-2 font-medium text-foreground">Usage Data</h3>
            <p>
              We automatically collect information about how you interact with our
              platform, including pages visited, features used, and time spent.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use the collected information for:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Providing and maintaining our platform</li>
              <li>Improving user experience and platform features</li>
              <li>Communicating with you about updates and support</li>
              <li>Ensuring security and preventing fraud</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to
              protect your personal information. However, no method of transmission over
              the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or
              as needed to provide you services. You can request deletion of your data at
              any time by contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Object to processing of your data</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">7. Third-Party Services</h2>
            <p>
              We may use third-party services for payment processing, analytics, and
              infrastructure. These service providers have access to your information only
              to perform specific tasks on our behalf and are obligated to protect your data.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@enkaibusiness.com" className="text-primary underline-offset-4 hover:underline">
                privacy@enkaibusiness.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
