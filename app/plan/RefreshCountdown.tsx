'use client';

import { useEffect, useState } from 'react';
import { formatRefreshCountdown } from './useParentsPie';

/**
 * Tiny isolated ticker so the 1s countdown does not re-render ParentsPie / PlanExperience.
 */
export function RefreshCountdown({
  nextAt,
  ready,
}: {
  nextAt: number | null;
  ready: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!ready || nextAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ready, nextAt]);

  if (!ready || nextAt == null) return null;
  const remainingMs = Math.max(0, nextAt - now);

  return (
    <p
      data-refresh-countdown
      title="Další načtení pie Parents"
      className="text-[9px] sm:text-[10px] font-mono text-zinc-500 tracking-wide whitespace-nowrap tabular-nums shrink-0"
    >
      obnova za {formatRefreshCountdown(remainingMs)}
    </p>
  );
}
