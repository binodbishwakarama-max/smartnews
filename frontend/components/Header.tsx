'use client';
import Link from 'next/link';
import { useState, useEffect, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { Menu, Clock } from 'lucide-react';
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
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString('en-US', {
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
            <header className="hidden md:block bg-background border-b border-border sticky top-0 z-50 transition-colors duration-200">
                {/* 1. BBC Top Utility Header Bar */}
                <div className="bg-black text-white text-xs font-sans py-2 px-6">
                    <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            {/* BBC Style Logo Blocks */}
                            <Link href="/" className="flex items-center gap-1 font-black text-lg tracking-tighter">
                                <span className="bg-accent text-white px-2 py-0.5 font-sans rounded-sm">S</span>
                                <span className="bg-white text-black px-2 py-0.5 font-sans rounded-sm">N</span>
                                <span className="ml-2 font-serif text-white tracking-normal font-bold">SMART NEWS</span>
                            </Link>

                            <div className="hidden lg:flex items-center gap-4 text-slate-300 text-[11px] font-medium border-l border-slate-700 pl-6">
                                <span className="flex items-center gap-1.5 text-accent font-bold">
                                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                    LIVE FEED
                                </span>
                                {currentDate && <span>{currentDate}</span>}
                                {stats && (
                                    <span>Processed: <strong className="text-white font-bold">{stats.total_articles}</strong></span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <StreakBadge />
                            
                            {mounted ? (
                                <>
                                    <SignedOut>
                                        <SignInButton mode="modal">
                                            <button className="hover:text-accent font-bold text-xs transition-colors">Sign In</button>
                                        </SignInButton>
                                        <span className="text-slate-700">|</span>
                                        <SignUpButton mode="modal">
                                            <button className="bg-accent text-white font-bold text-xs px-3 py-1 rounded-full hover:bg-red-700 transition-colors">Register</button>
                                        </SignUpButton>
                                    </SignedOut>
                                    <SignedIn>
                                        <div className="flex items-center gap-3">
                                            <UserButton afterSignOutUrl="/" />
                                            <Link href="/saved" className="hover:text-accent font-bold text-xs transition-colors">Saved</Link>
                                            <Link href="/admin" className="hover:text-accent font-bold text-xs transition-colors">Admin</Link>
                                        </div>
                                    </SignedIn>
                                </>
                            ) : null}

                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                {/* 2. BBC Category Navigation Bar */}
                <nav className="bg-card border-b border-border py-3">
                    <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 flex items-center justify-between gap-6">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                            aria-label="Open Menu"
                        >
                            <Menu className="w-5 h-5 text-primary" />
                        </button>

                        <div className="flex gap-6 overflow-x-auto no-scrollbar flex-1 items-center">
                            {CATEGORIES.map(cat => {
                                const isActive = currentCategory === cat || (cat === 'Latest' && currentCategory === 'Latest');
                                const isForYou = cat === 'For You';
                                return (
                                    <Link
                                        key={cat}
                                        href={cat === 'Latest' ? '/' : `/?category=${encodeURIComponent(cat)}`}
                                        prefetch={true}
                                        className={`text-sm font-sans font-bold transition-all relative py-1 whitespace-nowrap
                                            ${isActive ? 'text-accent border-b-2 border-accent' : 'text-secondary hover:text-primary'}
                                            ${isForYou ? 'flex items-center gap-1 text-amber-500' : ''}
                                        `}
                                    >
                                        {isForYou && <span className="text-xs">✦</span>}
                                        {cat}
                                    </Link>
                                );
                            })}
                        </div>

                        <SearchBar />
                    </div>
                </nav>
            </header>
        </>
    );
}
