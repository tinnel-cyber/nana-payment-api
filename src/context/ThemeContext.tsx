import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type ThemeMode = 'dark' | 'light' | 'blue';

export interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isBlue: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'nana_theme';
const THEME_COOKIE_KEY = 'nana_theme';

/**
 * Lit le thème stocké dans les cookies (idéal pour SSR)
 */
export function getThemeFromCookie(): ThemeMode | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)nana_theme=([^;]+)/);
    if (match) {
      const val = decodeURIComponent(match[1]);
      if (val === 'dark' || val === 'light' || val === 'blue') {
        return val as ThemeMode;
      }
    }
  } catch {}
  return null;
}

/**
 * Écrit le cookie de thème persistant (durée 1 an, SameSite=Lax)
 */
export function setThemeCookie(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  try {
    const maxAge = 60 * 60 * 24 * 365; // 365 jours
    document.cookie = `${THEME_COOKIE_KEY}=${encodeURIComponent(theme)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {}
}

/**
 * Applique la classe maîtresse (.theme-dark, .theme-light, .theme-blue)
 * sur la racine du document (html et body)
 */
export function applyThemeToDOM(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  const validThemes: ThemeMode[] = ['dark', 'light', 'blue'];
  validThemes.forEach((t) => {
    root.classList.remove(`theme-${t}`);
    if (body) body.classList.remove(`theme-${t}`);
  });

  const activeClass = `theme-${theme}`;
  root.classList.add(activeClass);
  if (body) body.classList.add(activeClass);

  // Synchronisation avec les classes Tailwind dark variant
  if (theme === 'dark' || theme === 'blue') {
    root.classList.add('dark');
    if (body) body.classList.add('dark');
  } else {
    root.classList.remove('dark');
    if (body) body.classList.remove('dark');
  }

  // Métadonnée thème pour navigateur mobile & PWA
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    const color = theme === 'light' ? '#ffffff' : theme === 'blue' ? '#0a192f' : '#070b14';
    metaThemeColor.setAttribute('content', color);
  }
}

/**
 * Détermine le thème initial (Cookie > LocalStorage > Préférence système > Dark par défaut)
 */
function resolveInitialTheme(): ThemeMode {
  // 1. Depuis le DOM si déjà injecté par le SSR
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const body = document.body;
    if (root.classList.contains('theme-light') || body?.classList.contains('theme-light')) return 'light';
    if (root.classList.contains('theme-blue') || body?.classList.contains('theme-blue')) return 'blue';
    if (root.classList.contains('theme-dark') || body?.classList.contains('theme-dark')) return 'dark';
  }

  // 2. Depuis les cookies
  const fromCookie = getThemeFromCookie();
  if (fromCookie) return fromCookie;

  // 3. Depuis le LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) || 
                    localStorage.getItem('nana_boutique_global_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'blue') {
        return saved as ThemeMode;
      }
    } catch {}
  }

  return 'dark';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => resolveInitialTheme());

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);

    // Appliquer au DOM immédiatement
    applyThemeToDOM(newTheme);

    // Sauvegarder dans le cookie pour le SSR
    setThemeCookie(newTheme);

    // Sauvegarder dans localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        localStorage.setItem('nana_boutique_global_theme', newTheme);
      } catch {}
    }

    // Déclencher un événement personnalisé
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nana_theme_change', { detail: { theme: newTheme } }));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      // Cycle fluide : dark -> light -> blue -> dark
      const next: ThemeMode = current === 'dark' ? 'light' : current === 'light' ? 'blue' : 'dark';
      applyThemeToDOM(next);
      setThemeCookie(next);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
          localStorage.setItem('nana_boutique_global_theme', next);
        } catch {}
        window.dispatchEvent(new CustomEvent('nana_theme_change', { detail: { theme: next } }));
      }
      return next;
    });
  }, []);

  // Synchronisation au montage initial et lors des événements inter-onglets
  useEffect(() => {
    applyThemeToDOM(theme);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const val = e.newValue as ThemeMode;
        if (val === 'dark' || val === 'light' || val === 'blue') {
          setThemeState(val);
          applyThemeToDOM(val);
        }
      }
    };

    const handleCustomChange = (e: any) => {
      if (e.detail?.theme && e.detail.theme !== theme) {
        setThemeState(e.detail.theme);
        applyThemeToDOM(e.detail.theme);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('nana_theme_change', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('nana_theme_change', handleCustomChange);
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isBlue: theme === 'blue',
  }), [theme, setTheme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
