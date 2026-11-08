import type { SVGProps } from 'react';

type AlgoryMarkProps = SVGProps<SVGSVGElement> & {
  /** When true, the price-tick uses accent; otherwise currentColor. */
  accentTick?: boolean;
};

/**
 * Algory mark — geometric “A” whose crossbar is a rising market tick.
 * Algo + story (ory): quantitative narrative, terminal/editorial.
 */
export function AlgoryMark({
  accentTick = true,
  className,
  ...props
}: AlgoryMarkProps) {
  const tick = accentTick ? 'var(--accent)' : 'currentColor';

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
      {...props}
    >
      {/* A silhouette — left / right legs */}
      <path
        d="M5.5 27 L16 3.5 L26.5 27"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Rising tick as crossbar */}
      <path
        d="M9.5 18.5 H15 L18.75 13.25 L22 16.25"
        stroke={tick}
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M19.75 16.25 H22 V13.75"
        stroke={tick}
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
