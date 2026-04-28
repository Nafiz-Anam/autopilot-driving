import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Link,
} from "@react-email/components";

interface Props {
  name: string;
  enquiryType: string;
  phone: string;
}

const enquiryLabels: Record<string, string> = {
  manual_lessons: "Manual Lessons",
  automatic_lessons: "Automatic Lessons",
  intensive_course: "Intensive Course",
  refresher: "Refresher Lessons",
  become_instructor: "Become an Instructor",
  other: "Other",
};

export function ContactFormAckEmail({ name, enquiryType, phone }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#F5F5F5", fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: "#E8200A",
              borderRadius: "16px 16px 0 0",
              padding: "32px 40px",
              textAlign: "center" as const,
            }}
          >
            <Heading style={{ color: "#ffffff", margin: 0, fontSize: 28, fontWeight: 800 }}>
              AutoPilot Driving School
            </Heading>
            <Text style={{ color: "rgba(255,255,255,0.85)", margin: "8px 0 0", fontSize: 14, letterSpacing: 1 }}>
              We received your enquiry
            </Text>
          </Section>

          {/* Body */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0 0 16px 16px",
              padding: "40px",
              border: "1px solid #E5E5E5",
              borderTop: "none",
            }}
          >
            <Heading style={{ fontSize: 22, color: "#0D0D0D", marginTop: 0 }}>
              Thanks {name}, we will be in touch!
            </Heading>
            <Text style={{ color: "#6B6B6B", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              We have received your enquiry and one of our friendly team will call you back as soon as possible.
            </Text>

            {/* Summary */}
            <Section
              style={{
                backgroundColor: "#F7F7F7",
                borderRadius: 12,
                padding: "20px 24px",
                margin: "0 0 24px",
              }}
            >
              <Text style={{ color: "#9B9B9B", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" as const, margin: "0 0 16px" }}>
                Your Enquiry Summary
              </Text>
              {[
                { label: "Enquiry Type", value: enquiryLabels[enquiryType] ?? enquiryType },
                { label: "Contact Number", value: phone },
              ].map(({ label, value }) => (
                <Text key={label} style={{ color: "#0D0D0D", fontSize: 14, margin: "4px 0" }}>
                  <span style={{ color: "#9B9B9B", display: "inline-block", width: 140 }}>{label}:</span>
                  <strong>{value}</strong>
                </Text>
              ))}
            </Section>

            <Hr style={{ borderColor: "#E5E5E5", margin: "0 0 24px" }} />

            <Text style={{ color: "#6B6B6B", fontSize: 14, lineHeight: 1.6 }}>
              In the meantime, feel free to browse our{" "}
              <Link href="https://autopilotdriving.co.uk/prices" style={{ color: "#E8200A", textDecoration: "none", fontWeight: 600 }}>
                pricing page
              </Link>{" "}
              or check if we cover your{" "}
              <Link href="https://autopilotdriving.co.uk/areas" style={{ color: "#E8200A", textDecoration: "none", fontWeight: 600 }}>
                area
              </Link>.
            </Text>
          </Section>

          {/* Footer */}
          <Text style={{ textAlign: "center" as const, color: "#B0B0B0", fontSize: 12, marginTop: 24 }}>
            AutoPilot Driving School &middot; hello@autopilotdriving.co.uk &middot; 01234 567 890
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ContactFormAckEmail;
