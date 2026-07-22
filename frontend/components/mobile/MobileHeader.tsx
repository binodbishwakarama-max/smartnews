'use client';
import Link from 'next/link';
import { Menu, Search, Sparkles } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import ThemeToggle from '../ThemeToggle';

interface MobileHeaderProps {
    onOpenMenu: () => void;
    onOpenSearch: () => void;
}

export default function MobileHeader({ onOpenMenu, onOpenSearch }: MobileHeaderProps) {
    return (
        <header className="md:hidden sticky top-0 z-40 bg-card/95 dark:bg-background/95 backdrop-blur-md border-b border-border/80 h-14 px-4 flex items-center justify-between select-none">
            {/* Left: Menu Drawer Trigger (Min 44x44px target) */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onOpenMenu}
                    className="w-11 h-11 flex items-center justify-center -ml-2 rounded-xl text-primary hover:bg-muted active:scale-95 transition-transform"
                    aria-label="Open Navigation Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[9px] font-black uppercase tracking-wider text-green-600 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                    <span>Live</span>
                </div>
            </div>

            {/* Center: Compact Newspaper Branding */}
            <Link href="/" className="flex flex-col items-center justify-center py-1">
                <h1 className="text-xl font-serif font-black tracking-tighter uppercase text-primary leading-none">
                    SMART NEWS<span className="text-accent">.</span>
                </h1>
                <span className="text-[7.5px] font-mono font-bold tracking-[0.25em] text-secondary uppercase mt-0.5">
                    EDITORIAL PRECISION
                </span>
            </Link>

            {/* Right: Search + Profile / Sign In + Theme Toggle (Min 44x44px target each) */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onOpenSearch}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-primary hover:bg-muted active:scale-95 transition-transform"
                    aria-label="Open Search"
                >
                    <Search className="w-4 h-4" />
                </button>

                <SignedIn>
                    <div className="w-9 h-9 flex items-center justify-center">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </SignedIn>

                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="h-8 px-2.5 bg-accent text-white font-black text-[10px] uppercase tracking-wider rounded-lg active:scale-95 shadow-sm">
                            In
                        </button>
                    </SignInButton>
                </SignedOut>

                <div className="w-9 h-9 flex items-center justify-center">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
