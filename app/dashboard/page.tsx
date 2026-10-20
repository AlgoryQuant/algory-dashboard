'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CandlestickBackdrop } from './CandlestickBackdrop';

const MODULES = [
  {
    href: '/plan',
    kicker: 'Q4 2026',
    title: 'Master plán',
    body: '40 000 Kč, pět titulů, harmonogram do poloviny prosince a tři scénáře vývoje.',
    accent: true,
  },
  {
    href: '/academy',
    kicker: 'Edukace',
    title: 'Academy',
    body: 'Forex, crypto a algotrading — lekce a koncepty. Edukace, ne trading bot.',
    accent: true,
  },
  {
    href: '/terminal',
    kicker: 'Market Data',
    title: 'Forex',
    body: 'Live liquidity streams, cross-pair tracking a orderflow metriky.',
    accent: false,
  },
  {
    href: '/terminal',
    kicker: 'Digital Assets',
    title: 'Crypto',
    body: 'Funding rates, arbitrage monitoring a derivative flow přehled.',
    accent: false,
  },
] as const;

const ease = [0.16, 1, 0.3, 1] as const;

export default function DashboardWelcome() {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center overflow-hidden bg-background px-6 pb-16 pt-6 font-sans text-foreground lg:px-0 lg:pb-24">
      <header className="absolute top-0 left-0 z-50 flex w-full items-center justify-between p-6 lg:px-12 lg:py-8">
        <div className="text-xl font-black tracking-tighter text-foreground">
          Algory<span className="text-muted">.</span>
        </div>
      </header>

      <CandlestickBackdrop />

      <div className="relative z-10 mt-20 flex w-full max-w-5xl flex-col items-center text-center lg:mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease }}
          className="flex flex-col items-center"
        >
          <p className="mb-5 font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-accent lg:mb-6 lg:text-xs">
            Welcome to Algory
          </p>

          <h1 className="mb-5 text-6xl font-black tracking-tighter text-foreground md:text-8xl lg:mb-6 lg:text-[9rem] lg:leading-[0.9]">
            Algory<span className="text-muted">.</span>
          </h1>

          <p className="mb-10 max-w-xl text-sm font-light leading-relaxed tracking-wide text-muted md:text-base lg:mb-12 lg:text-lg">
            Quantitative analysis & real-time execution — editorial terminal for Q4.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/terminal">
              <span className="group inline-flex items-center gap-3 border border-foreground bg-foreground px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-background transition-opacity hover:opacity-90 lg:px-10 lg:py-4 lg:text-sm">
                Initialize Engine
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>
            <Link href="/plan">
              <span className="inline-flex items-center gap-2 border border-edge px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:border-foreground/40 hover:bg-row-hover lg:px-10 lg:py-4 lg:text-sm">
                Open Q4 plán
              </span>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
          }}
          className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-0 border-t border-edge md:mt-24 md:grid-cols-2"
        >
          {MODULES.map((mod) => (
            <motion.div
              key={mod.title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
              }}
            >
              <Link
                href={mod.href}
                className="group flex h-full flex-col border-b border-edge px-1 py-7 text-left transition-colors hover:bg-row-hover md:border-r md:odd:pr-8 md:even:border-r-0 md:even:pl-8 lg:py-9"
              >
                <div className="mb-4 flex items-center justify-between gap-3 lg:mb-5">
                  <span
                    className={`font-mono text-[10px] font-medium uppercase tracking-[0.28em] ${
                      mod.accent ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    {mod.kicker}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted opacity-0 transition-opacity group-hover:opacity-100">
                    Open →
                  </span>
                </div>
                <h2 className="mb-2 text-2xl font-bold tracking-tight text-foreground lg:text-[1.65rem]">
                  {mod.title}
                </h2>
                <p className="max-w-sm text-xs leading-relaxed text-muted lg:text-sm">{mod.body}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
