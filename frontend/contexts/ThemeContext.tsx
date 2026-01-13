'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    themeMode: ThemeMode;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Determine if it's daytime based on local time
function isDaytime(): boolean {
    const hour = new Date().getHours();
    // Daytime: 6 AM to 6 PM
    return hour >= 6 && hour < 18;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    // Load saved preference on mount
    useEffect(() => {
        const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;

        if (savedMode) {
            setThemeMode(savedMode);
        } else {
            // Default to auto mode
            setThemeMode('auto');
        }

        setMounted(true);
    }, []);

    // Update theme based on mode
    useEffect(() => {
        if (!mounted) return;

        let newTheme: Theme;

        if (themeMode === 'auto') {
            // Auto mode: switch based on time of day
            newTheme = isDaytime() ? 'light' : 'dark';
        } else {
            // Manual mode: use selected theme
            newTheme = themeMode;
        }

        setTheme(newTheme);
    }, [themeMode, mounted]);

    // Auto-switch theme every minute when in auto mode
    useEffect(() => {
        if (themeMode !== 'auto') return;

        const interval = setInterval(() => {
            const newTheme = isDaytime() ? 'light' : 'dark';
            if (newTheme !== theme) {
                setTheme(newTheme);
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [themeMode, theme]);

    // Apply theme to document
    useEffect(() => {
        if (mounted) {
            const root = document.documentElement;

            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [theme, mounted]);

    // Save preference
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('themeMode', themeMode);
        }
    }, [themeMode, mounted]);

    const toggleTheme = () => {
        if (themeMode === 'auto') {
            // If in auto mode, switch to manual mode with opposite theme
            const newTheme = theme === 'light' ? 'dark' : 'light';
            setThemeMode(newTheme);
        } else {
            // If in manual mode, toggle between light and dark
            setThemeMode(theme === 'light' ? 'dark' : 'light');
        }
    };

    // Prevent flash of wrong theme - BUT we must still provide context!
    // We can conditionally render children if we want to wait for mount,
    // but the safer bet for hydration is to render, and let the effect handle the class.

    // For hydration mismatch prevention, we rely on suppressHydrationWarning on html tag in layout.
    // So we can safely render always.

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
