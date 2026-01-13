'use client';
import { Moon, Sun, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const { theme, themeMode, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by defining a default state for server
    // The server doesn't know about localStorage or time, so we must wait for mount.
    if (!mounted) {
        return (
            <button className="relative group p-2 opacity-0">
                <div className="w-20 h-10 rounded-full border-2 border-gray-300 bg-gray-100"></div>
            </button>
        );
    }

    const isDark = theme === 'dark';
    const isAuto = themeMode === 'auto';

    return (
        <button
            onClick={toggleTheme}
            className="relative group"
            aria-label={isAuto ? 'Auto theme (click to override)' : `Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {/* Outer glow effect */}
            <div className={`absolute inset-0 rounded-full blur-md transition-opacity duration-500 ${isDark ? 'bg-blue-400/20 opacity-100' : 'bg-yellow-400/20 opacity-100'
                }`} />

            {/* Main button */}
            <div className={`relative flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${isDark
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-blue-400'
                    : 'bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:border-yellow-500'
                } hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}>

                {/* Auto mode indicator */}
                {isAuto && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"
                        title="Auto mode active">
                        <Clock className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
                    </div>
                )}

                {/* Sun Icon */}
                <div className={`relative transition-all duration-500 ${isDark ? 'scale-0 -rotate-180 opacity-0' : 'scale-100 rotate-0 opacity-100'
                    }`}>
                    <Sun className="w-5 h-5 text-yellow-500" />
                    {/* Sun rays animation */}
                    <div className="absolute inset-0 animate-spin-slow">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-0.5 h-1.5 bg-yellow-400/50 rounded-full"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: `rotate(${i * 45}deg) translateY(-12px)`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Moon Icon */}
                <div className={`relative transition-all duration-500 ${isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-180 opacity-0'
                    } ${!isDark && 'absolute'}`}>
                    <Moon className="w-5 h-5 text-blue-300" />
                    {/* Stars around moon */}
                    {isDark && (
                        <>
                            <div className="absolute -top-1 -right-1 w-1 h-1 bg-blue-200 rounded-full animate-pulse" />
                            <div className="absolute -bottom-1 -left-1 w-0.5 h-0.5 bg-blue-300 rounded-full animate-pulse delay-75" />
                            <div className="absolute top-0 -left-2 w-0.5 h-0.5 bg-blue-200 rounded-full animate-pulse delay-150" />
                        </>
                    )}
                </div>

                {/* Label text */}
                <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isDark ? 'text-blue-200' : 'text-gray-700'
                    }`}>
                    {isAuto ? 'Auto' : (isDark ? 'Dark' : 'Light')}
                </span>
            </div>
        </button>
    );
}
