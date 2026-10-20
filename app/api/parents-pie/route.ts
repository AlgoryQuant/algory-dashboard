import { NextResponse } from 'next/server';
import { buildLiveModel, snapshotModel, type ParentsPieModel } from '../../plan/parentsModel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LIVE = 'https://live.trading212.com/api/v0';
const DEMO = 'https://demo.trading212.com/api/v0';
/** Short live TTL so a full page reload usually hits Trading 212 again. */
const TTL_MS = 12_000;
/** Keep last successful live pie briefly so a 429 does not flash hardcoded snapshot PnL. */
const LAST_LIVE_MAX_AGE_MS = 5 * 60_000;

type CacheEntry = { expires: number; model: ParentsPieModel };

let cache: CacheEntry | null = null;
let lastLive: CacheEntry | null = null;
let inflight: Promise<ParentsPieModel> | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetWait(reset: number | null): number {
  if (reset == null || !Number.isFinite(reset)) return 1500;
  const ms = reset > 10_000_000_000 ? reset - Date.now() : reset * 1000 - Date.now();
  return Math.min(Math.max(ms, 250), 8000);
}

function rememberLive(model: ParentsPieModel) {
  if (model.source === 'snapshot') return;
  const entry = { expires: Date.now() + TTL_MS, model };
  cache = entry;
  lastLive = { expires: Date.now() + LAST_LIVE_MAX_AGE_MS, model };
}

/** Prefer recent live numbers over PARENTS_SNAPSHOT when T212 rate-limits. */
function preferLiveOr(snapshot: ParentsPieModel): ParentsPieModel {
  if (lastLive && lastLive.expires > Date.now()) return lastLive.model;
  return snapshot;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function authCandidates(secret: string): string[] {
  // docs.trading212.com: Basic base64(API_KEY:API_SECRET).
  // T212_API_KEY may hold the full "key:secret" pair, or a legacy single token.
  const out: string[] = [];
  if (secret.includes(':')) {
    out.push(`Basic ${Buffer.from(secret, 'utf8').toString('base64')}`);
  }
  out.push(secret);
  out.push(`Basic ${Buffer.from(`${secret}:`, 'utf8').toString('base64')}`);
  out.push(`Basic ${Buffer.from(`:${secret}`, 'utf8').toString('base64')}`);
  return out;
}

async function getPath(base: string, path: string, authorization: string): Promise<{ status: number; json: unknown; reset: number | null }> {
  const response = await fetch(`${base}${path}`, {
    method: 'GET',
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const resetHeader = response.headers.get('x-ratelimit-reset');
  const reset = resetHeader == null ? null : Number(resetHeader);
  return { status: response.status, json: await readBody(response), reset: Number.isFinite(reset) ? reset : null };
}

async function getPathRetry(base: string, path: string, secret: string) {
  let attempt = await getPath(base, path, secret);
  for (let i = 0; i < 2 && attempt.status === 429; i += 1) {
    await sleep(resetWait(attempt.reset));
    attempt = await getPath(base, path, secret);
  }
  return attempt;
}

async function openSession(secret: string): Promise<{ base: string; source: 'live' | 'demo'; authorization: string; summary: unknown } | null> {
  const attempts: { environment: 'live' | 'demo'; statuses: number[] }[] = [];
  for (const source of ['live', 'demo'] as const) {
    const base = source === 'live' ? LIVE : DEMO;
    const statuses: number[] = [];
    for (const authorization of authCandidates(secret)) {
      const summary = await getPathRetry(base, '/equity/account/summary', authorization);
      statuses.push(summary.status);
      if (summary.status === 200 && summary.json) return { base, source, authorization, summary: summary.json };
      // 403 often means this environment has no usable account — try the next env (demo).
      if (summary.status === 403) break;
      if (summary.status !== 401) break;
    }
    attempts.push({ environment: source, statuses });
  }
  console.info(
    '[parents-pie] summary rejected',
    attempts.map((item) => `${item.environment}:${item.statuses.join(',')}`).join(' | '),
  );
  return null;
}

async function readPie(session: { base: string; source: 'live' | 'demo'; authorization: string; summary: unknown }): Promise<ParentsPieModel | null> {
  const [positions, pies] = await Promise.all([
    getPathRetry(session.base, '/equity/positions', session.authorization),
    getPathRetry(session.base, '/equity/pies', session.authorization),
  ]);
  if (pies.status !== 200) {
    console.info('[parents-pie] pies rejected', { status: pies.status, environment: session.source });
    return preferLiveOr(snapshotModel('unavailable'));
  }
  const list = Array.isArray(pies.json)
    ? pies.json
    : pies.json && typeof pies.json === 'object' && Array.isArray((pies.json as { items?: unknown }).items)
      ? (pies.json as { items: unknown[] }).items
      : [];
  const details: unknown[] = [];
  for (const item of list.slice(0, 12)) {
    if (!item || typeof item !== 'object' || !('id' in item)) continue;
    const id = (item as { id?: number | string }).id;
    if (id == null) continue;
    const detail = await getPathRetry(session.base, `/equity/pies/${id}`, session.authorization);
    if (detail.status === 200 && detail.json) details.push(detail.json);
  }
  const model = buildLiveModel({
    environment: session.source,
    summary: session.summary,
    positions: positions.status === 200 ? positions.json : [],
    pies: pies.json,
    details,
  });
  if (model) {
    console.info('[parents-pie] loaded', { environment: session.source, matchedBy: model.matchedBy, instruments: model.positions.length });
  }
  return model;
}

async function load(): Promise<ParentsPieModel> {
  const secret = process.env.T212_API_KEY?.trim();
  if (!secret) return preferLiveOr(snapshotModel('missing-key'));
  try {
    const session = await openSession(secret);
    if (!session) return preferLiveOr(snapshotModel('unauthorized'));
    return (await readPie(session)) ?? preferLiveOr(snapshotModel('not-found'));
  } catch (error) {
    console.info('[parents-pie] read failed', error instanceof Error ? error.name : 'error');
    return preferLiveOr(snapshotModel('unavailable'));
  }
}

async function loadCached(fresh: boolean): Promise<ParentsPieModel> {
  if (!fresh && cache && cache.expires > Date.now() && cache.model.source !== 'snapshot') {
    return cache.model;
  }
  if (!inflight) {
    inflight = load()
      .then((model) => {
        if (model.source !== 'snapshot') {
          rememberLive(model);
          return model;
        }
        // Never long-cache hardcoded snapshot — next reload should retry T212.
        return model;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fresh = url.searchParams.has('fresh');
  const model = await loadCached(fresh);
  return NextResponse.json(model, {
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
    },
  });
}
