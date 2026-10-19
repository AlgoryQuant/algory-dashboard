'use client';

import { useEffect, useState } from 'react';
import { snapshotModel, type ParentsPieModel } from './parentsModel';

function isModel(value: unknown): value is ParentsPieModel {
  if (!value || typeof value !== 'object') return false;
  const model = value as ParentsPieModel;
  return Array.isArray(model.positions) && model.positions.length > 0 && typeof model.source === 'string';
}

export function useParentsPie(enabled = true) {
  const [model, setModel] = useState<ParentsPieModel>(() => snapshotModel('unavailable'));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancel = false;
    (async () => {
      try {
        const response = await fetch('/api/parents-pie', { cache: 'no-store' });
        if (!response.ok) throw new Error('route');
        const data: unknown = await response.json();
        if (!cancel && isModel(data)) setModel(data);
      } catch {
        if (!cancel) setModel(snapshotModel('unavailable'));
      } finally {
        if (!cancel) setReady(true);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [enabled]);

  return { model, ready };
}
