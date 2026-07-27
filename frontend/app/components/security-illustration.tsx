/**
 * Cybersecurity hero illustration for the login page.
 *
 * Recreated with inline SVG per the mockup composition: a dark navy laptop with
 * a glowing blue shield + lock on screen, a standing padlock to the left, a
 * fingerprint tile lower-left, a code tile lower-right, and a very subtle
 * circuit-board backdrop with a pale-blue radial glow.
 *
 * To swap in a rendered asset instead, drop it at
 * /public/images/cipher-security-hero.png and render an <img> with
 * object-contain in place of this component.
 */
export function SecurityIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 470"
      role="img"
      aria-label="Illustration of a laptop displaying a security shield, with a padlock, fingerprint, and code symbols"
      className={className}
    >
      <defs>
        <radialGradient id="cipherGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bcd6ff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#bcd6ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cipherShield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b8dff" />
          <stop offset="100%" stopColor="#0b63f6" />
        </linearGradient>
        <linearGradient id="cipherLock" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3f86ff" />
          <stop offset="100%" stopColor="#0b57e0" />
        </linearGradient>
        <linearGradient id="cipherDeck" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#243354" />
          <stop offset="100%" stopColor="#161f38" />
        </linearGradient>
        <filter id="cipherSoft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* Pale radial glow */}
      <ellipse cx="320" cy="250" rx="290" ry="180" fill="url(#cipherGlow)" />

      {/* Subtle circuit board */}
      <g stroke="#a9c4ef" strokeWidth="1.5" fill="none" opacity="0.4">
        <path d="M40 120 H120 V70" />
        <path d="M600 150 H520 V90" />
        <path d="M70 400 H150 V360" />
        <path d="M590 380 H500 V420" />
        <path d="M300 40 V80" />
      </g>
      <g fill="#8fb2e8" opacity="0.5">
        <circle cx="40" cy="120" r="4" />
        <circle cx="120" cy="70" r="4" />
        <circle cx="600" cy="150" r="4" />
        <circle cx="520" cy="90" r="4" />
        <circle cx="150" cy="360" r="4" />
        <circle cx="500" cy="420" r="4" />
        <circle cx="300" cy="40" r="4" />
      </g>

      {/* Laptop lid / screen */}
      <rect x="176" y="74" width="288" height="182" rx="16" fill="#0f1b33" />
      <rect x="190" y="88" width="260" height="154" rx="9" fill="#0b1930" />

      {/* Faux code on screen (left column) */}
      <g fill="#31558f" opacity="0.9">
        <rect x="204" y="104" width="52" height="6" rx="3" />
        <rect x="204" y="118" width="34" height="6" rx="3" />
        <rect x="204" y="132" width="44" height="6" rx="3" />
        <rect x="204" y="196" width="40" height="6" rx="3" />
        <rect x="204" y="210" width="56" height="6" rx="3" />
      </g>

      {/* Glowing shield + lock */}
      <g transform="translate(320 165)">
        <path
          d="M0 -52 L46 -34 V6 C46 34 26 52 0 64 C-26 52 -46 34 -46 6 V-34 Z"
          fill="#1473ff"
          opacity="0.55"
          filter="url(#cipherSoft)"
        />
        <path
          d="M0 -52 L46 -34 V6 C46 34 26 52 0 64 C-26 52 -46 34 -46 6 V-34 Z"
          fill="url(#cipherShield)"
          stroke="#8fbaff"
          strokeWidth="2"
        />
        <path
          d="M-14 -2 V-12 A14 14 0 0 1 14 -12 V-2"
          fill="none"
          stroke="#dcebff"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <rect x="-16" y="-2" width="32" height="26" rx="5" fill="#eaf3ff" />
        <circle cx="0" cy="9" r="4" fill="#0b63f6" />
        <rect x="-2" y="9" width="4" height="9" rx="2" fill="#0b63f6" />
      </g>

      {/* Laptop deck / keyboard */}
      <path d="M150 256 H490 L522 306 H118 Z" fill="url(#cipherDeck)" />
      <path d="M118 306 H522 L516 316 H124 Z" fill="#0f1830" />
      <rect x="292" y="286" width="56" height="9" rx="4" fill="#2a3a5e" opacity="0.8" />

      {/* Standing padlock (left) */}
      <g transform="translate(96 196)">
        <path
          d="M8 30 V20 A22 22 0 0 1 52 20 V30"
          fill="none"
          stroke="#2f6fe0"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <rect x="0" y="28" width="60" height="52" rx="12" fill="url(#cipherLock)" />
        <rect x="0" y="28" width="60" height="18" rx="12" fill="#4a8bff" opacity="0.6" />
        <circle cx="30" cy="50" r="7" fill="#0b3fa0" />
        <rect x="27" y="50" width="6" height="14" rx="3" fill="#0b3fa0" />
      </g>

      {/* Fingerprint tile (lower-left) */}
      <g transform="translate(150 336)">
        <rect x="0" y="0" width="76" height="76" rx="16" fill="#0f1b33" />
        <g
          transform="translate(38 40)"
          fill="none"
          stroke="#3b8dff"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M-18 0 A18 20 0 0 1 18 0" />
          <path d="M-12 4 A12 14 0 0 1 12 4" />
          <path d="M-6 6 A6 9 0 0 1 6 6" />
          <path d="M0 -20 V12" opacity="0.9" />
        </g>
      </g>

      {/* Code tile (lower-right) */}
      <g transform="translate(430 336)">
        <rect x="0" y="0" width="76" height="76" rx="16" fill="#0f1b33" />
        <text
          x="38"
          y="48"
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="26"
          fontWeight="700"
          fill="#3b8dff"
        >
          &lt;/&gt;
        </text>
      </g>
    </svg>
  );
}
