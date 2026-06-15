import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | AutoPilot Driving School",
  description:
    "Read the terms and conditions governing lessons, bookings, payments, and cancellations at AutoPilot Driving School.",
};

export default function TermsPage() {
  return (
    <LegalPage
      badge="Legal"
      title="Terms & Conditions"
      lastUpdated="1 June 2026"
      intro="These Terms and Conditions govern your use of AutoPilot Driving School's services, including lesson bookings, instructor arrangements, and use of our website. By booking a lesson or creating an account you agree to be bound by these terms. Please read them carefully."
      sections={[
        {
          heading: "Definitions",
          content: (
            <p>
              'AutoPilot', 'we', 'us', and 'our' refer to AutoPilot Driving School. 'Student' or
              'you' refers to the person booking or receiving driving tuition. 'Instructor' refers to
              any DVSA-approved driving instructor operating under the AutoPilot brand. 'Lesson'
              refers to any scheduled driving tuition session booked through our platform.
            </p>
          ),
        },
        {
          heading: "Eligibility",
          content: (
            <>
              <p>To book lessons with AutoPilot Driving School, you must:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Be at least 17 years of age at the time of the lesson</li>
                <li>
                  Hold a valid UK provisional driving licence (or be in the process of applying for
                  one)
                </li>
                <li>
                  Be medically fit to drive and meet the minimum eyesight requirements set by the
                  DVLA
                </li>
                <li>
                  Provide accurate personal information when registering or booking
                </li>
              </ul>
              <p>
                Lessons booked on behalf of a minor (under 18) must be authorised by a parent or
                legal guardian.
              </p>
            </>
          ),
        },
        {
          heading: "Lesson Bookings",
          content: (
            <>
              <p>
                All lesson bookings are subject to instructor availability. A booking is confirmed
                once you receive a confirmation email or notification from AutoPilot. We reserve the
                right to reassign a student to a different instructor in exceptional circumstances
                (e.g., instructor illness or vehicle breakdown), and will notify you as soon as
                possible if this occurs.
              </p>
              <p>
                Students are responsible for ensuring they are ready at the agreed pick-up location
                at the confirmed time. Lateness of more than 15 minutes without prior notice may
                result in the lesson being forfeited without refund.
              </p>
            </>
          ),
        },
        {
          heading: "Pricing and Payment",
          content: (
            <>
              <p>
                Lesson prices are as published on our website and are subject to change. The price
                applicable to your booking is confirmed at the time of checkout. All prices include
                VAT where applicable.
              </p>
              <p>Payment is taken in full at the time of booking via our secure payment provider (Stripe). We accept all major debit and credit cards. We do not accept cash payments made directly to instructors.</p>
              <p>
                Where lesson packages are purchased, the package price applies only to the bundle
                specified. Unused lessons in a package may be refunded in accordance with our Refund
                Policy.
              </p>
            </>
          ),
        },
        {
          heading: "Cancellations by the Student",
          content: (
            <>
              <p>
                We understand that plans change. Our cancellation policy is as follows:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong>48+ hours notice:</strong> full refund or credit to your account
                </li>
                <li>
                  <strong>24–48 hours notice:</strong> 50% refund; 50% retained as a late
                  cancellation fee
                </li>
                <li>
                  <strong>Less than 24 hours notice or no-show:</strong> no refund; the full lesson
                  fee is forfeited
                </li>
              </ul>
              <p>
                Cancellations must be made via your online account or by contacting us directly on
                07450 556 963. Instructor-only verbal agreements to cancel are not accepted.
              </p>
            </>
          ),
        },
        {
          heading: "Cancellations by AutoPilot",
          content: (
            <p>
              In the rare event that we need to cancel a lesson (e.g., instructor illness, vehicle
              fault, severe weather), we will notify you as soon as possible and offer either a
              full refund or a rescheduled lesson at no additional cost. AutoPilot accepts no
              liability for consequential losses arising from a lesson cancellation by the school
              or instructor.
            </p>
          ),
        },
        {
          heading: "Student Conduct",
          content: (
            <>
              <p>Students are expected to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Arrive on time, sober, and in a fit state to drive</li>
                <li>Follow all lawful instructions given by their instructor</li>
                <li>
                  Treat their instructor and other road users with courtesy and respect
                </li>
                <li>
                  Not use a mobile phone or other distracting device during a lesson
                </li>
                <li>Bring their provisional driving licence to every lesson</li>
              </ul>
              <p>
                AutoPilot reserves the right to terminate lessons and suspend or cancel accounts
                where a student's conduct is unsafe, abusive, or in breach of these terms, without
                refund.
              </p>
            </>
          ),
        },
        {
          heading: "Gift Vouchers",
          content: (
            <p>
              Gift vouchers purchased through AutoPilot are valid for 12 months from the date of
              purchase. Vouchers cannot be exchanged for cash, transferred, or used in conjunction
              with other promotional offers unless explicitly stated. AutoPilot is not responsible
              for lost or stolen voucher codes.
            </p>
          ),
        },
        {
          heading: "Intellectual Property",
          content: (
            <p>
              All content on the AutoPilot Driving School website — including text, images, logos,
              graphics, and software — is owned by or licensed to AutoPilot Driving School and is
              protected by applicable intellectual property laws. You may not reproduce, distribute,
              or commercially exploit any part of this website without our prior written consent.
            </p>
          ),
        },
        {
          heading: "Limitation of Liability",
          content: (
            <p>
              AutoPilot Driving School's liability for any loss or damage arising from the use of
              our services is limited to the amount paid for the specific lesson or package in
              question. We are not liable for indirect, consequential, or incidental losses,
              including loss of earnings, test fees, or travel costs. Nothing in these terms
              excludes liability for death or personal injury caused by our negligence, or for
              fraud or fraudulent misrepresentation.
            </p>
          ),
        },
        {
          heading: "Governing Law",
          content: (
            <p>
              These Terms and Conditions are governed by the laws of England and Wales. Any disputes
              arising from or in connection with these terms shall be subject to the exclusive
              jurisdiction of the courts of England and Wales.
            </p>
          ),
        },
        {
          heading: "Changes to These Terms",
          content: (
            <p>
              We may revise these Terms and Conditions at any time. The current version will always
              be available on our website. Continued use of our services after changes are published
              constitutes acceptance of the updated terms. Where changes are material, registered
              users will be notified by email.
            </p>
          ),
        },
      ]}
    />
  );
}
