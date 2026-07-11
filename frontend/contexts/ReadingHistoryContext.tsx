'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReadRecord {
    id: number;
    category: string;
    readAt: number; // epoch ms
    completed: boolean;
}

interface StreakData {
    current: number;        // consecutive days
    longest: number;        // best ever
    lastReadDate: string;   // ISO date string "YYYY-MM-DD"
    todayRead: boolean;
}

interface CategoryAffinity {
    [category: string]: number; // read count per category
}

interface ReadingHistoryContextType {
    history: ReadRecord[];
    streak: StreakData;
    affinity: CategoryAffinity;
    topCategories: string[];       // top 3 by read count
    recordRead: (id: number, category: string) => void;
    markCompleted: (id: number) => void;
    hasRead: (id: number) => boolean;
    totalRead: number;
    todayCount: number;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const HISTORY_KEY = 'sn_reading_history';
const STREAK_KEY = 'sn_streak';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayDateStr(): string {
    return new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
}

function daysBetween(a: string, b: string): number {
    return Math.round(
        (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000
    );
}

function computeStreak(prev: StreakData): StreakData {
    const today = todayDateStr();
    if (prev.lastReadDate === today) {
        // Already registered today — just mark todayRead
        return { ...prev, todayRead: true };
    }

    const diff = prev.lastReadDate ? daysBetween(prev.lastReadDate, today) : 0;

    if (diff === 1) {
        // Consecutive day — increment
        const next = prev.current + 1;
        return {
            current: next,
            longest: Math.max(next, prev.longest),
            lastReadDate: today,
            todayRead: true,
        };
    } else if (diff > 1 || !prev.lastReadDate) {
        // Streak broken (or first ever read)
        return { current: 1, longest: Math.max(1, prev.longest), lastReadDate: today, todayRead: true };
    }
    return prev;
}

function computeAffinity(history: ReadRecord[]): CategoryAffinity {
    return history.reduce<CategoryAffinity>((acc, r) => {
        if (r.category) acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
    }, {});
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ReadingHistoryContext = createContext<ReadingHistoryContextType | undefined>(undefined);

export function ReadingHistoryProvider({ children }: { children: React.ReactNode }) {
    const [history, setHistory] = useState<ReadRecord[]>([]);
    const [streak, setStreak] = useState<StreakData>({
        current: 0, longest: 0, lastReadDate: '', todayRead: false
    });
    const [mounted, setMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const h = localStorage.getItem(HISTORY_KEY);
            const s = localStorage.getItem(STREAK_KEY);
            if (h) setHistory(JSON.parse(h));
            if (s) setStreak(JSON.parse(s));
        } catch {}
        setMounted(true);
    }, []);

    const saveHistory = useCallback((h: ReadRecord[]) => {
        setHistory(h);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch {}
    }, []);

    const saveStreak = useCallback((s: StreakData) => {
        setStreak(s);
        try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch {}
    }, []);

    const recordRead = useCallback((id: number, category: string) => {
        setHistory(prev => {
            if (prev.some(r => r.id === id)) return prev; // already recorded
            const next = [{ id, category, readAt: Date.now(), completed: false }, ...prev].slice(0, 500);
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
            return next;
        });
        setStreak(prev => {
            const next = computeStreak(prev);
            try { localStorage.setItem(STREAK_KEY, JSON.stringify(next)); } catch {}
            return next;
        });
    }, []);

    const markCompleted = useCallback((id: number) => {
        setHistory(prev => {
            const next = prev.map(r => r.id === id ? { ...r, completed: true } : r);
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
            return next;
        });
    }, []);

    const hasRead = useCallback((id: number) => history.some(r => r.id === id), [history]);

    const affinity = mounted ? computeAffinity(history) : {};
    const topCategories = Object.entries(affinity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);

    const today = todayDateStr();
    const todayCount = history.filter(r => new Date(r.readAt).toISOString().split('T')[0] === today).length;

    return (
        <ReadingHistoryContext.Provider value={{
            history,
            streak,
            affinity,
            topCategories,
            recordRead,
            markCompleted,
            hasRead,
            totalRead: history.length,
            todayCount,
        }}>
            {children}
        </ReadingHistoryContext.Provider>
    );
}

export function useReadingHistory() {
    const ctx = useContext(ReadingHistoryContext);
    if (!ctx) throw new Error('useReadingHistory must be used within ReadingHistoryProvider');
    return ctx;
}
