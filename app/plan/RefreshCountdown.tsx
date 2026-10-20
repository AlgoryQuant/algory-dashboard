'use client';

import { useEffect, useState } from 'react';
import { formatRefreshCountdown } from './useParentsPie';

/**
 * Tiny isolated ticker so the 1s countdown does not re-render ParentsPie / PlanExperience.
 */
export function RefreshCountdown({
  nextAt,
  ready,
  refreshing = false,
  onRefresh,
}: {
  nextAt: number | null;
  ready: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!ready || nextAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ready, nextAt]);

  if (!ready || nextAt == null) return null;
  const remainingMs = Math.max(0, nextAt - now);
  const busy = refreshing;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <p
        data-refresh-countdown
        title="Další načtení pie Parents"
        className="text-[9px] sm:text-[10px] font-mono text-zinc-500 tracking-wide whitespace-nowrap tabular-nums"
      >
        obnova za {formatRefreshCountdown(remainingMs)}
      </p>
      {onRefresh ? (
        <button
          type="button"
          data-refresh-now
          aria-label="Obnovit pie teď"
          title="Obnovit pie teď"
          disabled={busy}
          onClick={onRefresh}
          className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-zinc-500/35 hover:text-zinc-400/70 hover:bg-white/[0.04] transition-colors disabled:pointer-events-none disabled:opacity-40"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${busy ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13.5 8a5.5 5.5 0 1 1-1.4-3.6" />
            <path d="M13.5 2.5v3.2h-3.2" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
