import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Refund Policy | Autopilot Driving School",
  description:
    "Understand Autopilot Driving School's refund and cancellation policy for driving lessons, packages, and gift vouchers.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      badge="Legal"
      title="Refund Policy"
      lastUpdated="1 June 2026"
      intro="We want every student to feel confident booking with Autopilot Driving School. This Refund Policy sets out the circumstances in which refunds are granted, how to request one, and the timeframes involved. All refund requests are handled fairly and in accordance with the Consumer Rights Act 2015."
      sections={[
        {
          heading: "Individual Lesson Cancellations",
          content: (
            <>
              <p>
                Refunds for individual lesson cancellations are issued based on how much notice is
                given before the scheduled start time:
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-[#0D0D0D] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Notice Given</th>
                      <th className="px-4 py-3 text-left font-semibold">Refund</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="bg-white">
                      <td className="px-4 py-3">48 hours or more</td>
                      <td className="px-4 py-3 text-green-700 font-medium">100% refund</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3">Less than 24 hours / no-show</td>
                      <td className="px-4 py-3 text-red-700 font-medium">No refund</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3">
                Cancellations must be submitted through your Autopilot account or by calling us on{" "}
                <a href="tel:07450556963" className="text-[#E8200A] hover:underline">
                  07450 556 963
                </a>
                . Verbal agreements with your instructor alone do not constitute an official
                cancellation.
              </p>
            </>
          ),
        },
        {
          heading: "Lesson Package Refunds",
          content: (
            <>
              <p>
                If you have purchased a lesson package and wish to cancel remaining lessons, refunds
                are calculated as follows:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong>Before any lessons have taken place:</strong> full refund of the package
                  price, minus a £10 administration fee
                </li>
                <li>
                  <strong>After some lessons have been taken:</strong> a pro-rata refund for unused
                  lessons, calculated at the standard single-lesson rate (not the discounted package
                  rate), minus a £10 administration fee
                </li>
                <li>
                  <strong>Once the full package has been used:</strong> no refund is applicable
                </li>
              </ul>
              <p>
                Please note: because package prices represent a discounted rate, unused lessons are
                refunded at the standard single-lesson rate to account for the discount already
                applied.
              </p>
            </>
          ),
        },
        {
          heading: "Intensive Course Refunds",
          content: (
            <p>
              Intensive driving courses are pre-planned and require instructor scheduling in advance.
              Cancellations made 7 or more days before the course start date are eligible for a full
              refund minus a £25 booking fee. Cancellations made within 7 days of the start date
              are non-refundable. If Autopilot cancels or significantly changes an intensive course,
              a full refund will be issued.
            </p>
          ),
        },
        {
          heading: "Gift Vouchers",
          content: (
            <p>
              Gift vouchers are non-refundable once purchased. They are valid for 12 months from the
              date of purchase and cannot be exchanged for cash. If a lesson booked with a gift
              voucher is cancelled by the student with less than 24 hours' notice, the voucher
              credit is forfeited for that session. Vouchers cancelled by Autopilot will be fully
              reinstated.
            </p>
          ),
        },
        {
          heading: "Refunds Due to Instructor Issues",
          content: (
            <p>
              If a lesson is cancelled or cut short due to an instructor-related issue (e.g., illness,
              vehicle breakdown, or fault on the instructor's part), you will receive a full credit or
              refund for the affected lesson. We will contact you within 24 hours of the cancellation
              to arrange a replacement lesson or process your refund.
            </p>
          ),
        },
        {
          heading: "Refunds Due to Medical or Exceptional Circumstances",
          content: (
            <p>
              We understand that unexpected life events can prevent students from continuing lessons.
              If you are unable to continue due to a medical condition, bereavement, or other
              serious circumstance, please contact us directly. We will review your situation on a
              case-by-case basis and aim to find a fair resolution, which may include a credit to
              your account, a deferred start date, or a partial refund.
            </p>
          ),
        },
        {
          heading: "How to Request a Refund",
          content: (
            <>
              <p>To request a refund, please contact us via one of the following:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  Email:{" "}
                  <a
                    href="mailto:info@autopilotdrivingschool.co.uk"
                    className="text-[#E8200A] hover:underline"
                  >
                    info@autopilotdrivingschool.co.uk
                  </a>
                </li>
                <li>
                  Phone:{" "}
                  <a href="tel:07450556963" className="text-[#E8200A] hover:underline">
                    07450 556 963
                  </a>{" "}
                  (Mon–Fri 8am–8pm, Sat–Sun 9am–6pm)
                </li>
                <li>Via your online account dashboard</li>
              </ul>
              <p>
                Please include your name, booking reference, and the reason for your refund request.
                We will acknowledge your request within 2 business days and aim to process eligible
                refunds within 5–10 business days. Refunds are returned to the original payment method.
              </p>
            </>
          ),
        },
        {
          heading: "Your Statutory Rights",
          content: (
            <p>
              This Refund Policy does not affect your statutory rights under the Consumer Rights Act
              2015 or any other applicable UK consumer protection legislation. If you are unhappy
              with the outcome of a refund request, you may escalate your complaint to Citizens
              Advice or seek alternative dispute resolution. Autopilot Driving School is committed
              to resolving all disputes promptly and fairly.
            </p>
          ),
        },
      ]}
    />
  );
}
