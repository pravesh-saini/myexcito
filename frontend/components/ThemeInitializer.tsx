'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'excito_theme';

type Theme = 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export default function ThemeInitializer() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      applyTheme(stored === 'dark' ? 'dark' : 'light');
    } catch {
      applyTheme('light');
    }
  }, []);

  return null;
}
