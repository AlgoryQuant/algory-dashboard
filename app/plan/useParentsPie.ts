'use client';

import { useEffect, useState } from 'react';
import { snapshotModel, type ParentsPieModel } from './parentsModel';

/** Client refetch cadence for /api/parents-pie (countdown matches this). */
const REFRESH_MS = 5 * 60_000;

function isModel(value: unknown): value is ParentsPieModel {
  if (!value || typeof value !== 'object') return false;
  const model = value as ParentsPieModel;
  return Array.isArray(model.positions) && model.positions.length > 0 && typeof model.source === 'string';
}

/** Skip setState when poll returns the same pie numbers (avoids remounting Recharts). */
function samePieNumbers(a: ParentsPieModel, b: ParentsPieModel) {
  if (a === b) return true;
  if (
    a.source !== b.source ||
    a.fallback !== b.fallback ||
    a.holdingsValue !== b.holdingsValue ||
    a.holdingsPnl !== b.holdingsPnl ||
    a.deposits !== b.deposits ||
    a.currency !== b.currency ||
    a.positions.length !== b.positions.length
  ) {
    return false;
  }
  for (let i = 0; i < a.positions.length; i += 1) {
    const left = a.positions[i];
    const right = b.positions[i];
    if (
      left.id !== right.id ||
      left.value !== right.value ||
      left.pnl !== right.pnl ||
      left.actual !== right.actual ||
      left.color !== right.color
    ) {
      return false;
    }
  }
  return true;
}

export function formatRefreshCountdown(remainingMs: number) {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function useParentsPie(enabled = true) {
  const [model, setModel] = useState<ParentsPieModel>(() => snapshotModel('unavailable'));
  const [ready, setReady] = useState(false);
  const [nextAt, setNextAt] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancel = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let deferId: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const schedule = (ms: number) => {
      if (timeoutId) clearTimeout(timeoutId);
      setNextAt(Date.now() + ms);
      timeoutId = setTimeout(() => {
        void load();
      }, ms);
    };

    async function load() {
      try {
        const response = await fetch('/api/parents-pie', { cache: 'no-store' });
        if (!response.ok) throw new Error('route');
        const data: unknown = await response.json();
        if (cancel) return;
        if (isModel(data)) {
          setModel((prev) => (samePieNumbers(prev, data) ? prev : data));
          schedule(REFRESH_MS);
        } else {
          setModel((prev) => {
            const snap = snapshotModel('unavailable');
            return samePieNumbers(prev, snap) ? prev : snap;
          });
          schedule(REFRESH_MS);
        }
      } catch {
        if (cancel) return;
        setModel((prev) => {
          const snap = snapshotModel('unavailable');
          return samePieNumbers(prev, snap) ? prev : snap;
        });
        schedule(REFRESH_MS);
      } finally {
        if (!cancel) setReady(true);
      }
    }

    // Defer network work until after first paint so the snapshot pie can mount first.
    const start = () => {
      if (cancel) return;
      void load();
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(start, { timeout: 400 });
    } else {
      deferId = setTimeout(start, 0);
    }

    return () => {
      cancel = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (deferId) clearTimeout(deferId);
      if (idleId != null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [enabled]);

  return { model, ready, nextAt };
}
