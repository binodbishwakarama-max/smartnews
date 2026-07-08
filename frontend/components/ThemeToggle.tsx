"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "../contexts/ThemeContext";

const subscribe = () => () => {};

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  // Render a stable placeholder until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="w-8 h-8 flex items-center justify-center rounded-full border border-border text-secondary"
        aria-label="Toggle theme"
      >
        <Sun className="w-4 h-4" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors duration-200 ${
        isDark
          ? "border-white/20 text-gray-300 hover:border-white/40 hover:text-white"
          : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-900"
      }`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
}
