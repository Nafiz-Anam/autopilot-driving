export function AboutSection() {
  return (
    <section className="bg-white py-12 sm:py-16 px-4 border-t border-[#F0F0F0]">
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="text-2xl sm:text-3xl font-bold text-[#0D0D0D] mb-4"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          What is Autopilot?
        </h2>
        <p className="text-[#4A4A4A] text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
          Autopilot is an online booking platform for driving lessons. Learners
          use it to search for DVSA-approved instructors in their area, book,
          reschedule, or cancel lessons, and track their progress toward their
          test. Instructors use it to manage their availability and lesson
          bookings from a dashboard, and can optionally connect their Google
          Calendar so new bookings appear automatically alongside their other
          appointments.
        </p>
      </div>
    </section>
  );
}
