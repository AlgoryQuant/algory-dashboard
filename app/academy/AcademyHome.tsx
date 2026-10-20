'use client';

import Link from 'next/link';
import { AcademyShell } from './AcademyShell';
import { ACADEMY_TRACKS } from './tracks';

export default function AcademyHome() {
  return (
    <AcademyShell>
      <div className="max-w-2xl mb-12 lg:mb-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-500 mb-4">
          Algory Academy
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-4">
          Edukace. Ne trading bot.
        </h1>
        <p className="text-sm sm:text-base text-muted leading-relaxed">
          Portál pro forex, crypto a algotrading — lekce, koncepty a disciplína.
          Žádné spouštění vašeho kódu, žádné živé obchodování z Academy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {ACADEMY_TRACKS.map((track) => (
          <Link
            key={track.id}
            href={`/academy/${track.id}`}
            className="group flex flex-col text-left p-6 lg:p-7 border border-edge bg-surface/40 hover:bg-row-hover hover:border-foreground/20 transition-colors rounded-2xl"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4">
              {track.eyebrow}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground mb-2 group-hover:text-emerald-400 transition-colors">
              {track.title}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed flex-1">
              {track.summary}
            </p>
            <span className="mt-6 text-[10px] font-bold uppercase tracking-widest text-foreground/70 group-hover:text-foreground inline-flex items-center gap-2">
              Lekce
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </AcademyShell>
  );
}
