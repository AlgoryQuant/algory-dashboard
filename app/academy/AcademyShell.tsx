'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../ThemeToggle';
import { AlgoryWordmark } from '../brand/AlgoryWordmark';
import { Authorship } from '../brand/Authorship';

export function AcademyShell({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb?: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground font-sans flex flex-col">
      <header className="sticky top-0 z-40 border-b border-edge bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 py-4 flex items-center gap-3 sm:gap-4 pr-20 lg:pr-36">
          <Link href="/dashboard" className="text-xl shrink-0 hover:opacity-80 transition-opacity">
            <AlgoryWordmark markClassName="h-5 w-5" />
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
      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-10 lg:py-14 flex-1 w-full">{children}</main>
      <footer className="border-t border-edge py-6">
        <div className="max-w-5xl mx-auto px-5 lg:px-8 flex justify-center sm:justify-start">
          <Authorship />
        </div>
      </footer>
    </div>
  );
}
