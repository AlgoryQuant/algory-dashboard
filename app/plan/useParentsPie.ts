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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    let cancel = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

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
          setModel(data);
          schedule(REFRESH_MS);
        } else {
          setModel(snapshotModel('unavailable'));
          schedule(REFRESH_MS);
        }
      } catch {
        if (cancel) return;
        setModel(snapshotModel('unavailable'));
        schedule(REFRESH_MS);
      } finally {
        if (!cancel) setReady(true);
      }
    }

    void load();
    return () => {
      cancel = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || nextAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [enabled, nextAt]);

  const remainingMs = nextAt == null ? null : Math.max(0, nextAt - now);

  return { model, ready, remainingMs };
}
