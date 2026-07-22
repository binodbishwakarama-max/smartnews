'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Newspaper, Zap, Search, Bookmark, Menu } from 'lucide-react';

interface MobileBottomNavProps {
    onOpenMenu: () => void;
    onOpenSearch: () => void;
    onOpenPulse: () => void;
}

export default function MobileBottomNav({ onOpenMenu, onOpenSearch, onOpenPulse }: MobileBottomNavProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    
    const isHome = pathname === '/' && !category;
    const isSaved = pathname === '/saved';

    return (
        <nav 
            className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 dark:bg-background/95 backdrop-blur-xl border-t border-border/80 h-16 px-2 flex items-center justify-around select-none shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
            aria-label="Mobile Navigation Bar"
        >
            {/* 1. Feed Item */}
            <Link
                href="/"
                className={`flex-1 h-12 flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95 ${
                    isHome ? 'text-accent font-bold' : 'text-secondary hover:text-primary'
                }`}
            >
                <Newspaper className="w-5 h-5" />
                <span className="text-[9.5px] font-mono uppercase tracking-wider">Feed</span>
            </Link>

            {/* 2. Live Pulse */}
            <button
                onClick={onOpenPulse}
                className="flex-1 h-12 flex flex-col items-center justify-center gap-1 rounded-xl text-secondary hover:text-primary transition-all active:scale-95"
                aria-label="Open Live Pulse"
            >
                <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
                <span className="text-[9.5px] font-mono uppercase tracking-wider">Pulse</span>
            </button>

            {/* 3. Search */}
            <button
                onClick={onOpenSearch}
                className="flex-1 h-12 flex flex-col items-center justify-center gap-1 rounded-xl text-secondary hover:text-primary transition-all active:scale-95"
                aria-label="Search"
            >
                <Search className="w-5 h-5" />
                <span className="text-[9.5px] font-mono uppercase tracking-wider">Search</span>
            </button>

            {/* 4. Bookmarks */}
            <Link
                href="/saved"
                className={`flex-1 h-12 flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95 ${
                    isSaved ? 'text-accent font-bold' : 'text-secondary hover:text-primary'
                }`}
            >
                <Bookmark className="w-5 h-5" />
                <span className="text-[9.5px] font-mono uppercase tracking-wider">Saved</span>
            </Link>

            {/* 5. Menu Drawer */}
            <button
                onClick={onOpenMenu}
                className="flex-1 h-12 flex flex-col items-center justify-center gap-1 rounded-xl text-secondary hover:text-primary transition-all active:scale-95"
                aria-label="Open Menu"
            >
                <Menu className="w-5 h-5" />
                <span className="text-[9.5px] font-mono uppercase tracking-wider">Menu</span>
            </button>
        </nav>
    );
}
