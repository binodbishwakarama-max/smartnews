'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Menu, User } from 'lucide-react';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-4 glass shadow-sm' : 'py-6 bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

                {/* Left: Menu */}
                <button className="p-2 hover:bg-gray-100/50 rounded-full transition hidden md:block">
                    <Menu className="w-5 h-5 text-primary" />
                </button>

                {/* Center: Logo */}
                <Link href="/" className="absolute left-1/2 -translate-x-1/2 group">
                    <h1 className="font-serif text-3xl font-bold tracking-tight">
                        The Smart<span className="text-accent">News</span>.
                    </h1>
                    <div className="h-0.5 w-0 bg-accent transition-all duration-500 group-hover:w-full mx-auto mt-1 opacity-80"></div>
                </Link>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100/50 rounded-full transition">
                        <Search className="w-5 h-5 text-primary" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-accent transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-300">
                        <User className="w-3 h-3" />
                        <span>Sign In</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
