'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';

export function AcademyShell({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb?: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 border-b border-edge bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-4 flex items-center gap-3 sm:gap-4 pr-20 lg:pr-36">
          <Link href="/dashboard" className="text-xl font-black tracking-tighter text-foreground shrink-0">
            Algory<span className="text-emerald-500">.</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3 text-[10px] font-bold uppercase tracking-widest text-muted min-w-0">
            <Link href="/academy" className="hover:text-foreground transition-colors shrink-0">
              Academy
            </Link>
            {crumb}
          </nav>
          <div className="ml-auto shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-10 lg:py-14">{children}</main>
    </div>
  );
}
