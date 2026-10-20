'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  THEME_STORAGE_KEY,
  isThemeMode,
  resolveTheme,
  type ThemeMode,
} from '@/lib/theme';

type ThemeContextValue = {
  theme: ThemeMode;
  resolved: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDom(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  root.dataset.theme = mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const mode = isThemeMode(saved) ? saved : 'system';
    setThemeState(mode);
    const next = resolveTheme(mode);
    setResolved(next);
    applyDom(mode);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const current = localStorage.getItem(THEME_STORAGE_KEY);
      const active = isThemeMode(current) ? current : 'system';
      if (active !== 'system') return;
      const r = resolveTheme('system');
      setResolved(r);
      applyDom('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    const next = resolveTheme(mode);
    setResolved(next);
    applyDom(mode);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((prev) => {
      const order: ThemeMode[] = ['light', 'dark', 'system'];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      localStorage.setItem(THEME_STORAGE_KEY, next);
      const r = resolveTheme(next);
      setResolved(r);
      applyDom(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, cycleTheme }),
    [theme, resolved, setTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
