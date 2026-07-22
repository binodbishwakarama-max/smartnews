'use client';
import Link from 'next/link';
import { useState, useEffect, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import Sidebar from './Sidebar';
import StreakBadge from './StreakBadge';
import { API_ENDPOINTS } from '../lib/config';

const CATEGORIES = [
    'For You', 'Latest', 'World', 'Business', 'Technology', 'Science', 'Health', 'Politics', 'Culture', 'Sports'
];

const subscribe = () => () => {};

export default function Header() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category') || 'Latest';
    const [stats, setStats] = useState<{ total_articles: number; new_today: number; status: string } | null>(null);
    const [currentDate, setCurrentDate] = useState<string>('');
    const [fullDate, setFullDate] = useState<string>('');
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);

    useEffect(() => {
        const now = new Date();
        setCurrentDate(now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }));
        setFullDate(now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }));
    }, []);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch(API_ENDPOINTS.STATS);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch live stats", err);
            }
        }
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <header className="hidden md:block bg-white dark:bg-[#121212] border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-50">
                
                {/* Row 1 — Thin Utility Strip */}
                <div className="border-b border-neutral-200 dark:border-neutral-800">
                    <div className="max-w-[1200px] mx-auto px-5 py-1.5 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                                aria-label="Open Menu"
                            >
                                <Menu className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                            </button>
                            <SearchBar />
                        </div>

                        <span className="font-serif text-[11px] tracking-wide text-neutral-400 dark:text-neutral-500 hidden lg:block">
                            {currentDate}
                        </span>

                        <div className="flex items-center gap-3">
                            <StreakBadge />
                            
                            {mounted ? (
                                <>
                                    <SignedOut>
                                        <SignInButton mode="modal">
                                            <button className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">LOG IN</button>
                                        </SignInButton>
                                    </SignedOut>
                                    <SignedIn>
                                        <div className="flex items-center gap-2">
                                            <UserButton afterSignOutUrl="/" />
                                            <Link href="/saved" className="text-[11px] font-semibold text-neutral-500 hover:text-black dark:hover:text-white transition-colors">SAVED</Link>
                                        </div>
                                    </SignedIn>
                                </>
                            ) : null}

                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                {/* Row 2 — NYTimes-Style Serif Nameplate Masthead */}
                <div className="border-b border-neutral-300 dark:border-neutral-700">
                    <div className="max-w-[1200px] mx-auto px-5 py-3 flex items-center justify-center relative">
                        {/* Left accent — live dot + stats */}
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2 text-[10px] text-neutral-400 dark:text-neutral-500 font-sans">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            <span className="uppercase tracking-widest font-semibold">Live</span>
                            {stats && (
                                <span className="border-l border-neutral-300 dark:border-neutral-700 pl-2 ml-1">
                                    {stats.total_articles}+ stories
                                </span>
                            )}
                        </div>

                        {/* Center Nameplate */}
                        <Link href="/" className="text-center">
                            <h1 className="text-3xl lg:text-4xl font-serif font-black tracking-tight text-black dark:text-white leading-none">
                                The Smart News
                            </h1>
                        </Link>

                        {/* Right accent — date */}
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 hidden lg:block text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-sans font-semibold">
                            {fullDate}
                        </div>
                    </div>
                </div>

                {/* Row 3 — Section Navigation (pipe-separated) */}
                <div className="border-b border-neutral-200 dark:border-neutral-800">
                    <nav className="max-w-[1200px] mx-auto px-5 py-2 flex items-center justify-center">
                        <div className="flex items-center gap-0 overflow-x-auto no-scrollbar">
                            {CATEGORIES.map((cat, idx) => {
                                const isActive = currentCategory === cat || (cat === 'Latest' && currentCategory === 'Latest');
                                const isForYou = cat === 'For You';
                                return (
                                    <span key={cat} className="flex items-center">
                                        {idx > 0 && (
                                            <span className="text-neutral-300 dark:text-neutral-700 mx-3 select-none text-xs">|</span>
                                        )}
                                        <Link
                                            href={cat === 'Latest' ? '/' : `/?category=${encodeURIComponent(cat)}`}
                                            prefetch={true}
                                            className={`text-[13px] font-sans font-semibold transition-all whitespace-nowrap
                                                ${isActive 
                                                    ? 'text-black dark:text-white border-b-2 border-black dark:border-white pb-0.5' 
                                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                                                }
                                                ${isForYou ? 'flex items-center gap-1' : ''}
                                            `}
                                        >
                                            {isForYou && <span className="text-amber-500 text-xs">✦</span>}
                                            {cat}
                                        </Link>
                                    </span>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </header>
        </>
    );
}
