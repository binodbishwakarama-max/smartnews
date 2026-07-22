'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Menu, Search, Clock } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import ThemeToggle from '../ThemeToggle';
import StreakBadge from '../StreakBadge';

const CATEGORIES = [
    'For You', 'Latest', 'World', 'Business', 'Technology', 'AI & Startups', 'Science', 'Health', 'Politics', 'Sports'
];

interface TabletHeaderProps {
    onOpenMenu: () => void;
}

export default function TabletHeader({ onOpenMenu }: TabletHeaderProps) {
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category') || 'Latest';

    return (
        <header className="bg-card/90 dark:bg-background/90 backdrop-blur-md border-b border-border sticky top-0 z-40 select-none">
            {/* Top Bar */}
            <div className="px-6 py-2 border-b border-border flex justify-between items-center text-xs font-mono font-bold uppercase tracking-wider">
                <div className="flex items-center gap-3">
                    <button onClick={onOpenMenu} className="p-1.5 hover:bg-muted rounded-lg" aria-label="Open Menu">
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="flex items-center gap-1.5 text-accent"><Clock className="w-3.5 h-3.5 animate-pulse" /> LIVE updates</span>
                </div>
                <div className="flex items-center gap-4">
                    <StreakBadge />
                    <SignedIn>
                        <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="text-accent font-black hover:underline">Sign In</button>
                        </SignInButton>
                    </SignedOut>
                    <ThemeToggle />
                </div>
            </div>

            {/* Branding */}
            <div className="py-4 px-6 text-center">
                <Link href="/">
                    <h1 className="text-4xl font-serif font-black tracking-tighter uppercase text-primary">
                        The Smart News<span className="text-accent">.</span>
                    </h1>
                </Link>
            </div>

            {/* Category Nav */}
            <nav className="border-t border-border py-2 px-6 overflow-x-auto no-scrollbar">
                <div className="flex justify-center gap-6 whitespace-nowrap">
                    {CATEGORIES.map(cat => {
                        const isActive = currentCategory === cat || (cat === 'Latest' && currentCategory === 'Latest');
                        return (
                            <Link
                                key={cat}
                                href={cat === 'Latest' ? '/' : `/?category=${encodeURIComponent(cat)}`}
                                className={`text-xs font-mono font-bold uppercase tracking-wider py-1 ${
                                    isActive ? 'text-accent border-b-2 border-accent' : 'text-secondary hover:text-primary'
                                }`}
                            >
                                {cat}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </header>
    );
}
