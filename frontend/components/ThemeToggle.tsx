'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('excito_theme') as Theme | null;
    const initial = stored === 'light' || stored === 'dark' ? stored : getSystemTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('excito_theme', next);
    applyTheme(next);
  };

  // Avoid hydration mismatch on icon/label.
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer"
      >
        <i className="ri-moon-line text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center" />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer"
    >
      <i
        className={`${isDark ? 'ri-sun-line' : 'ri-moon-line'} text-gray-600 dark:text-gray-300 w-5 h-5 flex items-center justify-center`}
      />
    </button>
  );
}
