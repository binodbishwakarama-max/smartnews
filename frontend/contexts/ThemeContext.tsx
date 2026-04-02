'use client';

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';
type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    themeMode: ThemeMode;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEME_MODE_STORAGE_KEY = 'themeMode';
const themeModeSubscribers = new Set<() => void>();

function resolveThemeFromHour(hour: number): Theme {
    return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

function isThemeMode(value: string | null): value is ThemeMode {
    return value === 'auto' || value === 'light' || value === 'dark';
}

function readStoredThemeMode(): ThemeMode {
    if (typeof window === 'undefined') {
        return 'auto';
    }

    const savedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (isThemeMode(savedMode)) {
        return savedMode;
    }

    return 'auto';
}

function subscribeToThemeMode(onStoreChange: () => void) {
    themeModeSubscribers.add(onStoreChange);

    if (typeof window === 'undefined') {
        return () => {
            themeModeSubscribers.delete(onStoreChange);
        };
    }

    const handleStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === THEME_MODE_STORAGE_KEY) {
            onStoreChange();
        }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
        themeModeSubscribers.delete(onStoreChange);
        window.removeEventListener('storage', handleStorage);
    };
}

function notifyThemeModeSubscribers() {
    themeModeSubscribers.forEach(listener => listener());
}

function persistThemeMode(mode: ThemeMode) {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    notifyThemeModeSubscribers();
}

function subscribeToHydration() {
    return () => { };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const isHydrated = useSyncExternalStore<boolean>(subscribeToHydration, () => true, () => false);
    const themeMode = useSyncExternalStore<ThemeMode>(subscribeToThemeMode, readStoredThemeMode, () => 'auto');
    const [clock, setClock] = useState(() => Date.now());

    const theme = useMemo<Theme>(() => {
        if (!isHydrated) {
            return 'light';
        }

        if (themeMode === 'auto') {
            return resolveThemeFromHour(new Date(clock).getHours());
        }

        return themeMode;
    }, [clock, isHydrated, themeMode]);

    useEffect(() => {
        if (!isHydrated || themeMode !== 'auto') {
            return;
        }

        const interval = setInterval(() => {
            setClock(Date.now());
        }, 60000);

        return () => clearInterval(interval);
    }, [isHydrated, themeMode]);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const setThemeMode = (mode: ThemeMode) => {
        persistThemeMode(mode);
        if (mode === 'auto') {
            setClock(Date.now());
        }
    };

    const toggleTheme = () => {
        if (themeMode === 'auto') {
            setThemeMode(theme === 'light' ? 'dark' : 'light');
            return;
        }

        setThemeMode(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
