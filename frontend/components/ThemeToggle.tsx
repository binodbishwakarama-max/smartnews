"use client";

import { useEffect, useState } from "react";
import { Clock, Moon, Sun } from "lucide-react";

import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, themeMode, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, []);

  const isDark = theme === "dark";
  const isAuto = themeMode === "auto";

  // Render a static version until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        onClick={toggleTheme}
        className="relative group"
        aria-label="Switch to dark mode"
      >
        <div className="absolute inset-0 rounded-full blur-md transition-opacity duration-500 bg-yellow-400/20 opacity-100" />
        <div className="relative flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:border-yellow-500 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
          <div className="relative transition-all duration-500 scale-100 rotate-0 opacity-100">
            <Sun className="w-5 h-5 text-yellow-500" />
            <div className="absolute inset-0 animate-spin-slow">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-1.5 bg-yellow-400/50 rounded-full"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `rotate(${i * 45}deg) translateY(-12px)`,
                  }}
                />
              ))}
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-gray-700">
            Light
          </span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative group"
      aria-label={
        isAuto
          ? "Auto theme (click to override)"
          : `Switch to ${isDark ? "light" : "dark"} mode`
      }
    >
      <div
        className={`absolute inset-0 rounded-full blur-md transition-opacity duration-500 ${
          isDark ? "bg-blue-400/20 opacity-100" : "bg-yellow-400/20 opacity-100"
        }`}
      />

      <div
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
          isDark
            ? "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-blue-400"
            : "bg-gradient-to-br from-white to-gray-50 border-gray-300 hover:border-yellow-500"
        } hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}
      >
        {isAuto && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"
            title="Auto mode active"
          >
            <Clock className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
          </div>
        )}

        <div
          className={`relative transition-all duration-500 ${
            isDark
              ? "scale-0 -rotate-180 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }`}
        >
          <Sun className="w-5 h-5 text-yellow-500" />
          <div className="absolute inset-0 animate-spin-slow">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-1.5 bg-yellow-400/50 rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${i * 45}deg) translateY(-12px)`,
                }}
              />
            ))}
          </div>
        </div>

        <div
          className={`relative transition-all duration-500 ${
            isDark
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 rotate-180 opacity-0"
          } ${!isDark && "absolute"}`}
        >
          <Moon className="w-5 h-5 text-blue-300" />
          {isDark && (
            <>
              <div className="absolute -top-1 -right-1 w-1 h-1 bg-blue-200 rounded-full animate-pulse" />
              <div className="absolute -bottom-1 -left-1 w-0.5 h-0.5 bg-blue-300 rounded-full animate-pulse delay-75" />
              <div className="absolute top-0 -left-2 w-0.5 h-0.5 bg-blue-200 rounded-full animate-pulse delay-150" />
            </>
          )}
        </div>

        <span
          className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
            isDark ? "text-blue-200" : "text-gray-700"
          }`}
        >
          {isAuto ? "Auto" : isDark ? "Dark" : "Light"}
        </span>
      </div>
    </button>
  );
}
