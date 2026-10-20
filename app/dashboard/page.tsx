'use client';

import React from 'react';
import Link from 'next/link';
import { CandlestickBackdrop } from './CandlestickBackdrop';

const MODULES = [
  {
    href: '/plan',
    kicker: 'Q4 2026',
    title: 'Master plán',
    body: '40 000 Kč, pět titulů, harmonogram do poloviny prosince a tři scénáře vývoje.',
  },
  {
    href: '/academy',
    kicker: 'Edukace',
    title: 'Academy',
    body: 'Forex, crypto a algotrading — lekce a koncepty. Edukace, ne trading bot.',
  },
  {
    href: '/terminal',
    kicker: 'Trhy',
    title: 'Forex',
    body: 'Živá data a orderflow v terminálu — páry, likvidita, přehled na jednom místě.',
  },
  {
    href: '/terminal',
    kicker: 'Trhy',
    title: 'Crypto',
    body: 'Funding, flow a deriváty — stejný terminál, jiný trh.',
  },
] as const;

export default function DashboardWelcome() {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background px-6 pb-16 pt-6 font-sans text-foreground sm:px-10 lg:px-16 lg:pb-20">
      <header className="relative z-50 flex w-full items-center justify-between py-2 lg:py-4">
        <div className="text-lg font-semibold tracking-tight text-foreground">
          Algory<span className="text-muted">.</span>
        </div>
      </header>

      <CandlestickBackdrop />

      <div className="relative z-10 mx-auto mt-14 flex w-full max-w-3xl flex-col animate-[hubFade_0.55s_ease_both] lg:mt-20">
        <div>
          <h1 className="mb-4 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl lg:leading-[1.05]">
            Algory<span className="text-muted">.</span>
          </h1>

          <p className="mb-9 max-w-md text-[15px] leading-relaxed text-muted sm:text-base">
            Hub pro Q4 — master plán, academy a trhy. Bez šumu, jen to, co potřebuješ otevřít.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/terminal"
              className="inline-flex items-center border border-foreground bg-foreground px-5 py-2.5 text-xs font-medium tracking-wide text-background transition-opacity hover:opacity-90"
            >
              Terminal
            </Link>
            <Link
              href="/plan"
              className="inline-flex items-center border border-edge px-5 py-2.5 text-xs font-medium tracking-wide text-foreground transition-colors hover:border-foreground/35 hover:bg-row-hover"
            >
              Master plán
            </Link>
          </div>
        </div>

        <nav aria-label="Moduly" className="mt-16 border-t border-edge pt-2 sm:mt-20">
          {MODULES.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className="group flex flex-col gap-1 border-b border-edge py-5 transition-colors hover:bg-row-hover sm:flex-row sm:items-baseline sm:gap-8 sm:py-6"
            >
              <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {mod.kicker}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium tracking-tight text-foreground sm:text-xl">
                  {mod.title}
                </span>
                <span className="mt-1 block max-w-lg text-sm leading-relaxed text-muted">
                  {mod.body}
                </span>
              </span>
              <span className="hidden shrink-0 text-xs text-muted transition-colors group-hover:text-foreground sm:block">
                →
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
