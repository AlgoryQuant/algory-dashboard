import type { HTMLAttributes } from 'react';
import { AlgoryMark } from './AlgoryMark';

type AlgoryWordmarkProps = HTMLAttributes<HTMLSpanElement> & {
  /** Mark size in Tailwind classes */
  markClassName?: string;
  /** Show accent on the mark tick and the trailing period */
  accent?: boolean;
};

/**
 * Mark + “Algory.” wordmark for headers and hub surfaces.
 */
export function AlgoryWordmark({
  className = '',
  markClassName = 'h-5 w-5',
  accent = true,
  ...props
}: AlgoryWordmarkProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 tracking-tighter ${className}`}
      {...props}
    >
      <AlgoryMark
        accentTick={accent}
        className={`${markClassName} shrink-0 text-foreground`}
      />
      <span className="font-black text-foreground">
        Algory
        <span className={accent ? 'text-accent' : 'text-muted'}>.</span>
      </span>
    </span>
  );
}
