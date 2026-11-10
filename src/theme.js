import { useSyncExternalStore } from 'react';

const themeKey = 'homepage-theme-override';
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set();

function isDark() {
  const override = localStorage.getItem(themeKey);
  return override === 'dark' || (override !== 'light' && systemTheme.matches);
}

function refreshTheme() {
  document.documentElement.dataset.theme = isDark() ? 'dark' : 'light';
  listeners.forEach(listener => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

systemTheme.addEventListener('change', refreshTheme);
window.addEventListener('storage', event => {
  if (event.key === themeKey || event.key === null) refreshTheme();
});
refreshTheme();

export function useDarkTheme() {
  return useSyncExternalStore(subscribe, isDark);
}

export function toggleTheme() {
  localStorage.setItem(themeKey, isDark() ? 'light' : 'dark');
  refreshTheme();
}
