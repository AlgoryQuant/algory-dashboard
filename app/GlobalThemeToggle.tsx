'use client';

import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

/** Fixed chrome toggle — hidden on /plan where the header control lives. */
export function GlobalThemeToggle() {
  const pathname = usePathname();
  if (pathname?.startsWith('/plan') || pathname?.startsWith('/academy')) return null;
  return <ThemeToggle className="bg-background/80 backdrop-blur-md" />;
}
