'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Menu, Clock } from 'lucide-react';
import Sidebar from './Sidebar';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';

const CATEGORIES = [
    'Latest', 'World', 'Business', 'Technology', 'Science', 'Health', 'Politics', 'Culture', 'Sports'
];

export default function Header() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category') || 'Latest';

    return (
        <header className="bg-white dark:bg-background border-b-2 border-black dark:border-white sticky top-0 z-50">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            {/* Utility Bar */}
            <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center text-[10px] uppercase font-black tracking-widest border-b border-border">
                <div className="flex gap-4 items-center">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Live Updates</span>
                    <span>US Edition</span>
                </div>
                <div className="flex gap-4 items-center">
                    <button className="hover:underline">Subscribe</button>
                    <button className="hover:underline">Sign In</button>
                    <Link href="/saved" className="hover:text-accent font-black hover:underline flex items-center gap-1">
                        SAVED
                    </Link>
                    <ThemeToggle />
                </div>
            </div>

            {/* Main Branding */}
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col items-center gap-6">
                <Link href="/">
                    <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter text-center">
                        The Smart News<span className="text-accent">.</span>
                    </h1>
                </Link>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary text-center max-w-md">
                    Independent Journalism • Worldwide Coverage • Real-Time AI Curation
                </p>
            </div>

            {/* Navigation */}
            <nav className="border-t border-border py-3">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -ml-2 hover:bg-black hover:text-white transition-all transform hover:scale-110 active:scale-95"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex gap-8 overflow-x-auto no-scrollbar">
                        {CATEGORIES.map(cat => {
                            const isActive = currentCategory === cat;
                            return (
                                <Link
                                    key={cat}
                                    href={cat === 'Latest' ? '/' : `/?category=${cat}`}
                                    className={`text-[12px] font-black uppercase tracking-widest transition-all relative py-1
                                        ${isActive ? 'text-accent border-b-2 border-accent' : 'hover:text-accent'}
                                    `}
                                >
                                    {cat}
                                </Link>
                            );
                        })}
                    </div>
                    <SearchBar />
                </div>
            </nav>
        </header>
    );
}
