import { useEffect, useState } from 'react';

export enum Theme {
  dark = 'dracula',
  light = 'emerald',
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(Theme.dark);

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    const resolved = stored ?? Theme.dark;
    setTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, []);

  const toggle = () => {
    const next = theme === Theme.dark ? Theme.light : Theme.dark;
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    setTheme(next);
  };
  return { theme, toggle };
}
