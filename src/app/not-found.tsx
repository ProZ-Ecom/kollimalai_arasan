import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-md">
        <svg
          viewBox="0 0 240 220"
          className="mx-auto mb-6 h-56 w-56"
          role="img"
          aria-label="Millet stalks in a basket illustration"
        >
          <circle cx="120" cy="108" r="100" className="fill-primary-100" />

          {/* basket */}
          <path
            d="M62 172l10 34a10 10 0 0 0 10 8h76a10 10 0 0 0 10-8l10-34z"
            className="fill-secondary-300"
            stroke="currentColor"
          />
          <path d="M62 172h116" className="stroke-secondary-500" strokeWidth="4" />
          <path d="M70 182h100M76 194h88M83 206h74" className="stroke-secondary-500" strokeWidth="2.5" opacity="0.6" />

          {/* left stalk */}
          <g transform="translate(85 178) rotate(-14)">
            <path d="M0 0c0-70 6-100 6-140" fill="none" className="stroke-secondary-600" strokeWidth="5" strokeLinecap="round" />
            <path d="M4 100c-13 4-22-2-28-11" fill="none" className="stroke-secondary-500" strokeWidth="4" strokeLinecap="round" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const y = -140 + i * 12;
              const shade = ["fill-primary-600", "fill-primary-500", "fill-primary-400"][i % 3];
              return (
                <g key={i}>
                  <ellipse cx={-6} cy={y} rx="6" ry="8" className={shade} />
                  <ellipse cx={7} cy={y + 5} rx="6" ry="8" className={shade} />
                </g>
              );
            })}
          </g>

          {/* right stalk */}
          <g transform="translate(150 180) rotate(12)">
            <path d="M0 0c0-60 -5-84 -5-118" fill="none" className="stroke-secondary-600" strokeWidth="5" strokeLinecap="round" />
            <path d="M-4 82c12 4 20-1 25-10" fill="none" className="stroke-secondary-500" strokeWidth="4" strokeLinecap="round" />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const y = -118 + i * 12;
              const shade = ["fill-primary-500", "fill-primary-400", "fill-primary-600"][i % 3];
              return (
                <g key={i}>
                  <ellipse cx={-6} cy={y} rx="5" ry="7" className={shade} />
                  <ellipse cx={5} cy={y + 5} rx="5" ry="7" className={shade} />
                </g>
              );
            })}
          </g>

          {/* scattered grains */}
          <circle cx="55" cy="160" r="4" className="fill-primary-500" />
          <circle cx="45" cy="170" r="3" className="fill-primary-400" />
          <circle cx="185" cy="164" r="4" className="fill-primary-500" />
          <circle cx="196" cy="172" r="3" className="fill-primary-400" />
        </svg>
        <h1 className="text-5xl font-bold mb-2">404</h1>
        <p className="text-xl font-semibold mb-2">Page not found</p>
        <p className="text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
