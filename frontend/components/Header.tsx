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
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).toUpperCase());
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
            <header className="bg-card/90 dark:bg-background/90 backdrop-blur-xl border-b border-border sticky top-0 z-50 transition-all duration-300">

            {/* Utility Bar - Hidden on Mobile */}
            <div className="hidden md:flex max-w-7xl mx-auto px-6 py-2 justify-between items-center text-[10px] uppercase font-bold tracking-widest border-b border-border">
                <div className="flex gap-4 items-center">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-accent animate-pulse" /> Live Updates</span>
                    {currentDate && <span className="text-secondary font-mono">{currentDate}</span>}
                    {stats && (
                        <div className="flex items-center gap-4 pl-4 border-l border-border text-secondary normal-case font-medium">
                            <span className="flex items-center gap-1.5 uppercase font-bold text-[9px]">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                                {stats.status}
                            </span>
                            <span>Processed: <strong className="text-primary font-bold">{stats.total_articles}</strong></span>
                            <span>Today: <strong className="text-accent font-bold">+{stats.new_today}</strong></span>
                        </div>
                    )}
                </div>
                <div className="flex gap-4 items-center">
                    <StreakBadge />
                    <button className="hover:underline text-secondary hover:text-primary">Subscribe</button>

                    {mounted ? (
                        <>
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="hover:underline hover:text-accent font-bold">Sign In</button>
                                </SignInButton>
                                <span className="mx-2 text-border">|</span>
                                <SignUpButton mode="modal">
                                    <button className="hover:underline hover:text-accent font-bold">Sign Up</button>
                                </SignUpButton>
                            </SignedOut>
                            <SignedIn>
                                <div className="flex items-center gap-4">
                                    <UserButton afterSignOutUrl="/" />
                                    <Link href="/saved" className="hover:text-accent font-black hover:underline flex items-center gap-1">
                                        SAVED
                                    </Link>
                                    <Link href="/admin" className="hover:text-accent font-black hover:underline flex items-center gap-1">
                                        ADMIN
                                    </Link>
                                </div>
                            </SignedIn>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-secondary opacity-0" aria-hidden="true">
                            <span>Sign In</span>
                            <span>|</span>
                            <span>Sign Up</span>
                        </div>
                    )}

                    <ThemeToggle />
                </div>
            </div>

            {/* Main Branding */}
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col items-center gap-4">
                <Link href="/">
                    <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter text-center uppercase">
                        The Smart News<span className="text-accent">.</span>
                    </h1>
                </Link>
                <p className="text-[10px] font-mono font-black uppercase tracking-[0.35em] text-secondary text-center max-w-2xl">
                    Independent Journalism • Worldwide Coverage • Editorial Precision
                </p>
            </div>

            {/* Navigation */}
            <nav className="border-t-4 border-b-4 border-double border-brand dark:border-border py-2.5 bg-background">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 hover:bg-brand hover:text-background dark:hover:bg-primary dark:hover:text-background transition-all transform active:scale-95 border border-transparent hover:border-brand rounded-none"
                        aria-label="Open Menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex gap-8 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map(cat => {
                            const isActive = currentCategory === cat || (cat === 'Latest' && currentCategory === 'Latest');
                            const isForYou = cat === 'For You';
                            return (
                                <Link
                                    key={cat}
                                    href={cat === 'Latest' ? '/' : `/?category=${encodeURIComponent(cat)}`}
                                    className={`text-[11px] font-mono font-black uppercase tracking-widest transition-all relative py-1 whitespace-nowrap
                                        ${isActive ? 'text-accent border-b-2 border-accent' : 'hover:text-accent'}
                                        ${isForYou ? 'flex items-center gap-1' : ''}
                                    `}
                                >
                                    {isForYou && <span className="text-[8px]">✦</span>}
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
