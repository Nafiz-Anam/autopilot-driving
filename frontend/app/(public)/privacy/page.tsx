import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Autopilot Driving School",
  description:
    "Read how Autopilot Driving School collects, uses, and protects your personal data in accordance with UK GDPR.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      badge="Legal"
      title="Privacy Policy"
      lastUpdated="1 June 2026"
      intro="Autopilot Driving School ('we', 'us', 'our') is committed to protecting your privacy. This policy explains what personal data we collect, why we collect it, how we use it, and your rights under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018."
      sections={[
        {
          heading: "Who We Are",
          content: (
            <>
              <p>
                Autopilot Driving School is a DVSA-approved driving school operating across East
                Berkshire, West London, and surrounding areas. Our registered business address is
                Ilford, London, England. We are the data controller for the personal information
                you provide to us.
              </p>
              <p>
                For data-related enquiries, contact us at{" "}
                <a
                  href="mailto:info@autopilotdrivingschool.co.uk"
                  className="text-[#E8200A] hover:underline"
                >
                  info@autopilotdrivingschool.co.uk
                </a>
                .
              </p>
            </>
          ),
        },
        {
          heading: "Data We Collect",
          content: (
            <>
              <p>We may collect and process the following categories of personal data:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong>Identity data:</strong> full name, date of birth, gender
                </li>
                <li>
                  <strong>Contact data:</strong> email address, phone number, home address, postcode
                </li>
                <li>
                  <strong>Account data:</strong> username, hashed password, account preferences
                </li>
                <li>
                  <strong>Booking data:</strong> lesson type, dates, duration, instructor preference,
                  transmission preference
                </li>
                <li>
                  <strong>Payment data:</strong> billing information processed securely via Stripe (we
                  do not store card details)
                </li>
                <li>
                  <strong>Technical data:</strong> IP address, browser type, device information,
                  cookies and usage data
                </li>
                <li>
                  <strong>Communications:</strong> messages sent via our contact form or email
                </li>
                <li>
                  <strong>Instructor data:</strong> driving licence number, ADI/PDI licence details,
                  vehicle information, DBS check status
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "How We Use Your Data",
          content: (
            <>
              <p>We use your personal data for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>To create and manage your account</li>
                <li>To process lesson bookings and payments</li>
                <li>To match students with suitable instructors</li>
                <li>To send booking confirmations, reminders, and receipts</li>
                <li>To respond to enquiries submitted via our contact form</li>
                <li>To manage instructor applications and onboarding</li>
                <li>To improve our website and services through analytics</li>
                <li>
                  To send promotional communications where you have given consent (you may opt out at
                  any time)
                </li>
                <li>To comply with legal obligations</li>
              </ul>
            </>
          ),
        },
        {
          heading: "Legal Basis for Processing",
          content: (
            <>
              <p>We rely on the following lawful bases under UK GDPR:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong>Contract:</strong> processing is necessary to fulfil your booking or account
                  registration
                </li>
                <li>
                  <strong>Legitimate interests:</strong> improving our services, preventing fraud, and
                  communicating relevant updates
                </li>
                <li>
                  <strong>Legal obligation:</strong> where we are required to retain data by law (e.g.,
                  financial records)
                </li>
                <li>
                  <strong>Consent:</strong> for marketing communications and non-essential cookies
                </li>
              </ul>
            </>
          ),
        },
        {
          heading: "Cookies",
          content: (
            <>
              <p>
                Our website uses cookies to enhance your experience. Cookies are small text files
                stored on your device. We use:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong>Essential cookies:</strong> required for the site to function (e.g., session
                  management, authentication)
                </li>
                <li>
                  <strong>Analytics cookies:</strong> help us understand how visitors use the site
                  (requires consent)
                </li>
                <li>
                  <strong>Preference cookies:</strong> remember your settings and choices (requires
                  consent)
                </li>
              </ul>
              <p>
                You can manage cookie preferences at any time via the cookie banner or your browser
                settings.
              </p>
            </>
          ),
        },
        {
          heading: "Third-Party Services",
          content: (
            <p>
              We share data with carefully selected third-party providers only where necessary to
              deliver our services. These include Stripe (payment processing), email delivery
              providers, and cloud hosting infrastructure. All third parties are required to handle
              your data securely and in accordance with UK GDPR. We do not sell your personal data
              to any third party.
            </p>
          ),
        },
        {
          heading: "Data Retention",
          content: (
            <p>
              We retain personal data only for as long as necessary. Account data is kept for the
              duration of your relationship with us plus 2 years. Financial and booking records are
              retained for 7 years to comply with HMRC requirements. Data submitted via the contact
              form is retained for 12 months. You may request deletion of your data at any time,
              subject to our legal obligations.
            </p>
          ),
        },
        {
          heading: "Your Rights",
          content: (
            <>
              <p>Under UK GDPR, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong>Access</strong> the personal data we hold about you
                </li>
                <li>
                  <strong>Rectify</strong> inaccurate or incomplete data
                </li>
                <li>
                  <strong>Erasure</strong> ("right to be forgotten") in certain circumstances
                </li>
                <li>
                  <strong>Restrict</strong> processing of your data
                </li>
                <li>
                  <strong>Data portability</strong> — receive your data in a structured, machine-readable format
                </li>
                <li>
                  <strong>Object</strong> to processing based on legitimate interests or for direct marketing
                </li>
                <li>
                  <strong>Withdraw consent</strong> at any time where processing is based on consent
                </li>
              </ul>
              <p>
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:info@autopilotdrivingschool.co.uk"
                  className="text-[#E8200A] hover:underline"
                >
                  info@autopilotdrivingschool.co.uk
                </a>
                . We will respond within 30 days. You also have the right to lodge a complaint with
                the Information Commissioner's Office (ICO) at{" "}
                <a
                  href="https://ico.org.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E8200A] hover:underline"
                >
                  ico.org.uk
                </a>
                .
              </p>
            </>
          ),
        },
        {
          heading: "Data Security",
          content: (
            <p>
              We implement appropriate technical and organisational measures to protect your personal
              data against unauthorised access, loss, or disclosure. These include encrypted
              connections (HTTPS), hashed password storage, access controls, and regular security
              reviews. No method of transmission over the internet is 100% secure; however, we take
              all reasonable steps to protect your data.
            </p>
          ),
        },
        {
          heading: "Changes to This Policy",
          content: (
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices or applicable law. The updated version will be posted on this page with a
              revised "last updated" date. We encourage you to review this page periodically. Where
              changes are material, we will notify registered users by email.
            </p>
          ),
        },
      ]}
    />
  );
}
