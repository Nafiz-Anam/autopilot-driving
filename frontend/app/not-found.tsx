import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Road illustration */}
        <div className="mb-8">
          <div
            className="text-[120px] font-extrabold leading-none"
            style={{
              fontFamily: "'Moderniz','Barlow',sans-serif",
              color: "#E8200A",
              opacity: 0.15,
            }}
          >
            404
          </div>
          <div className="-mt-12 relative z-10">
            <p
              className="text-5xl font-extrabold text-brand-black"
              style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
            >
              404
            </p>
          </div>
        </div>

        <h1
          className="text-3xl font-extrabold text-brand-black mb-3"
          style={{ fontFamily: "'Moderniz','Barlow',sans-serif" }}
        >
          You&apos;ve taken a wrong turn.
        </h1>
        <p className="text-brand-muted mb-8 max-w-sm mx-auto">
          Looks like this road doesn&apos;t lead anywhere. The page you&apos;re looking for has moved or doesn&apos;t exist.
        </p>

        {/* Mini road graphic */}
        <div className="flex items-center justify-center gap-3 mb-8 opacity-30">
          <div className="h-px flex-1 bg-brand-muted" />
          <div className="w-3 h-3 bg-brand-red rounded-full" />
          <div className="h-px flex-1 bg-brand-muted" />
        </div>

        <Link
          href="/"
          className="inline-block px-8 py-3 bg-brand-red text-white rounded-full font-bold hover:bg-brand-orange transition-colors duration-200"
        >
          Return Home
        </Link>
        <p className="mt-4 text-sm text-brand-muted">
          Or{" "}
          <Link href="/contact" className="text-brand-red hover:text-brand-orange">
            contact us
          </Link>{" "}
          if you think something&apos;s broken.
        </p>
      </div>
    </div>
  );
}
