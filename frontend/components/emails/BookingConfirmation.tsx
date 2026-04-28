import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Row,
  Column,
  Link,
} from "@react-email/components";

interface Props {
  bookingReference: string;
  studentName: string;
  instructorName: string;
  lessonType: string;
  scheduledAt: string;
  totalAmount: string;
}

export function BookingConfirmationEmail({
  bookingReference,
  studentName,
  instructorName,
  lessonType,
  scheduledAt,
  totalAmount,
}: Props) {
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
            <Heading style={{ color: "#fff", margin: 0, fontSize: 28, fontWeight: 800 }}>
              AutoPilot Driving School
            </Heading>
            <Text style={{ color: "rgba(255,255,255,0.85)", margin: "8px 0 0", fontSize: 14, letterSpacing: 1 }}>
              Booking Confirmed
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
              Hi {studentName}!
            </Heading>
            <Text style={{ color: "#6B6B6B", fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>
              Great news — your booking is confirmed. We look forward to seeing you on the road!
            </Text>

            {/* Booking Reference */}
            <Section
              style={{
                backgroundColor: "#F7F7F7",
                borderRadius: 12,
                padding: "20px 24px",
                textAlign: "center" as const,
                margin: "0 0 24px",
              }}
            >
              <Text style={{ color: "#9B9B9B", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" as const, margin: "0 0 6px" }}>
                Booking Reference
              </Text>
              <Text style={{ color: "#E8200A", fontSize: 28, fontWeight: 800, letterSpacing: 4, margin: 0 }}>
                {bookingReference}
              </Text>
            </Section>

            {/* Details table */}
            <Hr style={{ borderColor: "#E5E5E5", margin: "0 0 20px" }} />
            {[
              { label: "Lesson Type", value: lessonType },
              { label: "Instructor", value: instructorName },
              { label: "Date & Time", value: scheduledAt },
              { label: "Amount Paid", value: totalAmount },
            ].map(({ label, value }) => (
              <Row key={label} style={{ marginBottom: 14 }}>
                <Column style={{ width: "42%", color: "#9B9B9B", fontSize: 13 }}>{label}</Column>
                <Column style={{ color: "#0D0D0D", fontWeight: 600, fontSize: 13 }}>{value}</Column>
              </Row>
            ))}
            <Hr style={{ borderColor: "#E5E5E5", margin: "20px 0 24px" }} />

            <Text style={{ color: "#6B6B6B", fontSize: 14, lineHeight: 1.6, margin: "0 0 24px" }}>
              Need to make changes? Please contact us at least 24 hours before your lesson.
            </Text>

            <Link
              href="https://autopilotdriving.co.uk/student/bookings"
              style={{
                display: "inline-block",
                backgroundColor: "#E8200A",
                color: "#ffffff",
                padding: "12px 28px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              View My Bookings
            </Link>
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

export default BookingConfirmationEmail;
