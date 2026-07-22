'use client';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import ThemeToggle from '../ThemeToggle';

interface MobileHeaderProps {
    onOpenMenu: () => void;
    onOpenSearch?: () => void;
}

export default function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
    return (
        <header className="md:hidden sticky top-0 z-40 bg-card/95 dark:bg-background/95 backdrop-blur-md border-b border-border/80 h-14 px-3 flex items-center justify-between select-none max-w-full overflow-hidden">
            {/* Left: Menu Drawer Trigger & Live Badge */}
            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    onClick={onOpenMenu}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-primary hover:bg-muted active:scale-95 transition-transform"
                    aria-label="Open Navigation Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[9px] font-black uppercase tracking-wider text-green-600 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                    <span>Live</span>
                </div>
            </div>

            {/* Center: Compact Newspaper Branding */}
            <Link href="/" className="flex flex-col items-center justify-center py-1 mx-1 min-w-0 shrink">
                <h1 className="text-lg sm:text-xl font-serif font-black tracking-tighter uppercase text-primary leading-none truncate">
                    SMART NEWS<span className="text-accent">.</span>
                </h1>
                <span className="text-[7px] sm:text-[7.5px] font-mono font-bold tracking-[0.15em] sm:tracking-[0.25em] text-secondary uppercase mt-0.5 truncate">
                    EDITORIAL PRECISION
                </span>
            </Link>

            {/* Right: Profile / Sign In + Theme Toggle */}
            <div className="flex items-center gap-1 shrink-0">
                <SignedIn>
                    <div className="w-8 h-8 flex items-center justify-center">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </SignedIn>

                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="h-7 px-2.5 bg-accent text-white font-black text-[9px] uppercase tracking-wider rounded-lg active:scale-95 shadow-sm">
                            In
                        </button>
                    </SignInButton>
                </SignedOut>

                <div className="w-8 h-8 flex items-center justify-center">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
