'use client';

import type { ThemeMode } from '@/lib/theme';
import { useTheme } from './ThemeProvider';

const LABELS: Record<ThemeMode, string> = {
  light: 'Světlý',
  dark: 'Tmavý',
  system: 'Systém',
};

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.75" />
      <path d="M8 1.5v1.75M8 12.75V14.5M1.5 8h1.75M12.75 8H14.5M3.05 3.05l1.24 1.24M11.71 11.71l1.24 1.24M3.05 12.95l1.24-1.24M11.71 4.29l1.24-1.24" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.2 9.35A5.5 5.5 0 0 1 6.65 2.8 5.6 5.6 0 1 0 13.2 9.35Z" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3" width="11" height="8" rx="1.25" />
      <path d="M6 13.5h4M8 11v2.5" />
    </svg>
  );
}

const MODES: ThemeMode[] = ['light', 'dark', 'system'];

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Motiv zobrazení"
      className={`inline-flex items-center rounded-full border border-edge bg-foreground/[0.03] p-0.5 shrink-0 ${className}`}
    >
      {MODES.map((mode) => {
        const active = theme === mode;
        const Icon = mode === 'light' ? SunIcon : mode === 'dark' ? MoonIcon : SystemIcon;
        return (
          <button
            key={mode}
            type="button"
            aria-label={LABELS[mode]}
            aria-pressed={active}
            title={LABELS[mode]}
            onClick={() => setTheme(mode)}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              active
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
