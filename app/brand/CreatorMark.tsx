import type { SVGProps } from 'react';

type CreatorMarkProps = SVGProps<SVGSVGElement>;

/**
 * Discreet authorship glyph for Michal Březina (MB.).
 * Intended for footer / “vytvořil” — does not compete with Algory.
 */
export function CreatorMark({ className, ...props }: CreatorMarkProps) {
  return (
    <svg
      viewBox="0 0 32 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      {...props}
    >
      {/* M */}
      <path
        d="M1.5 13.5 V2.5 L7 10 L12.5 2.5 V13.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* B — vertical + two bowls */}
      <path
        d="M16 2.5 V13.5 H21.2 C23.5 13.5 24.8 12.1 24.8 10.4 C24.8 9.2 24.1 8.3 22.8 8 C24 7.6 24.6 6.7 24.6 5.5 C24.6 3.8 23.3 2.5 21 2.5 H16 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Period */}
      <rect x="27.25" y="11.75" width="2" height="2" fill="currentColor" />
    </svg>
  );
}
