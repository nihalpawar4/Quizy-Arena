'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { updateDocument } from '@/lib/firebase/firestore';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'arena_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const userProfile = useAuthStore((s) => s.userProfile);

  // Initialize: Firebase settings > localStorage > system preference
  useEffect(() => {
    const firebaseTheme = userProfile?.settings?.theme;
    if (firebaseTheme === 'light' || firebaseTheme === 'dark') {
      setThemeState(firebaseTheme);
      localStorage.setItem(STORAGE_KEY, firebaseTheme);
    } else if (firebaseTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(systemDark ? 'dark' : 'light');
    } else {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
      }
    }
    setMounted(true);
    // Only run once on mount + when userProfile first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.settings?.theme]);

  // Apply theme class to <html>
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    // Persist to Firebase if logged in
    if (firebaseUser) {
      updateDocument('users', firebaseUser.uid, {
        'settings.theme': t,
      }).catch(() => {
        // Silent fail — localStorage is the fallback
      });
    }
  }, [firebaseUser]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      // Persist to Firebase if logged in
      if (firebaseUser) {
        updateDocument('users', firebaseUser.uid, {
          'settings.theme': next,
        }).catch(() => {});
      }
      return next;
    });
  }, [firebaseUser]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
