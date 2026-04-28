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
  recipientName: string;
  senderName: string;
  amount: string;
  code: string;
  message?: string;
  expiresAt: string;
}

export function GiftVoucherEmail({
  recipientName,
  senderName,
  amount,
  code,
  message,
  expiresAt,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#F5F5F5", fontFamily: "'DM Sans', 'Helvetica Neue', Arial, sans-serif" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "40px 16px" }}>
          {/* Festive Header */}
          <Section
            style={{
              background: "linear-gradient(135deg, #E8200A 0%, #FF5500 100%)",
              borderRadius: "16px 16px 0 0",
              padding: "40px",
              textAlign: "center" as const,
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: "0 0 8px", letterSpacing: 2, textTransform: "uppercase" as const }}>
              Gift Voucher
            </Text>
            <Heading style={{ color: "#fff", margin: 0, fontSize: 32, fontWeight: 800 }}>
              AutoPilot Driving School
            </Heading>
            <Text style={{ color: "rgba(255,255,255,0.8)", margin: "12px 0 0", fontSize: 16 }}>
              Give the Gift of Freedom 🎁
            </Text>
          </Section>

          {/* Body */}
          <Section
            style={{
              backgroundColor: "#fff",
              borderRadius: "0 0 16px 16px",
              padding: "40px",
              border: "1px solid #E5E5E5",
              borderTop: "none",
            }}
          >
            <Heading style={{ fontSize: 22, color: "#0D0D0D", marginTop: 0 }}>
              Hi {recipientName}!
            </Heading>
            <Text style={{ color: "#6B6B6B", fontSize: 15, lineHeight: 1.6 }}>
              {senderName} has sent you an AutoPilot Driving School gift voucher.
              Use it to book driving lessons online!
            </Text>

            {/* Personal Message */}
            {message && (
              <Section
                style={{
                  backgroundColor: "#FFF5F3",
                  borderLeft: "4px solid #E8200A",
                  borderRadius: "0 12px 12px 0",
                  padding: "16px 20px",
                  margin: "20px 0",
                }}
              >
                <Text style={{ color: "#0D0D0D", fontSize: 14, fontStyle: "italic", margin: 0 }}>
                  &ldquo;{message}&rdquo;
                </Text>
                <Text style={{ color: "#6B6B6B", fontSize: 12, margin: "8px 0 0" }}>— {senderName}</Text>
              </Section>
            )}

            <Hr style={{ borderColor: "#E5E5E5", margin: "24px 0" }} />

            {/* Voucher Code Box */}
            <Section
              style={{
                backgroundColor: "#0D0D0D",
                borderRadius: 16,
                padding: "32px",
                textAlign: "center" as const,
                margin: "24px 0",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" as const, margin: "0 0 8px" }}>
                Voucher Value
              </Text>
              <Text style={{ color: "#FF5500", fontSize: 48, fontWeight: 800, margin: "0 0 16px" }}>
                {amount}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" as const, margin: "0 0 8px" }}>
                Your Code
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: 6,
                  backgroundColor: "#E8200A",
                  borderRadius: 12,
                  padding: "12px 24px",
                  display: "inline-block",
                  margin: 0,
                }}
              >
                {code}
              </Text>
            </Section>

            <Text style={{ color: "#6B6B6B", fontSize: 13, textAlign: "center" as const, margin: "0 0 24px" }}>
              Valid until {expiresAt}
            </Text>

            <Link
              href="https://autopilotdriving.co.uk/booking"
              style={{
                display: "block",
                backgroundColor: "#E8200A",
                color: "#fff",
                padding: "14px 28px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                textAlign: "center" as const,
              }}
            >
              Book Your Lessons Now →
            </Link>

            <Text style={{ color: "#6B6B6B", fontSize: 12, textAlign: "center" as const, marginTop: 16 }}>
              Enter the code above at checkout. Vouchers can be used on any lesson.
            </Text>
          </Section>

          {/* Footer */}
          <Text style={{ textAlign: "center" as const, color: "#6B6B6B", fontSize: 12, marginTop: 24 }}>
            AutoPilot Driving School · hello@autopilotdriving.co.uk · 01234 567 890
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default GiftVoucherEmail;
