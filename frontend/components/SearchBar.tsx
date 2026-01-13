'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { API_ENDPOINTS } from '../lib/config';

interface SearchResult {
    id: number;
    title: string;
    summary: string;
    category: string;
    source: string;
    url: string;
    publish_date: string;
}

const POPULAR_SEARCHES = ['Climate Change', 'AI Technology', 'Sports News', 'Politics', 'Health'];

export default function SearchBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    // Save search to recent searches
    const saveSearch = (searchQuery: string) => {
        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            setSelectedIndex(-1);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const url = new URL(API_ENDPOINTS.SEARCH);
                url.searchParams.append('q', query);
                url.searchParams.append('limit', '10');

                const res = await fetch(url.toString());
                const data = await res.json();
                setResults(data.results || []);
                setTotalResults(data.total || 0);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, -1));
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                const selected = results[selectedIndex];
                if (selected) {
                    saveSearch(query);
                    window.open(selected.url, '_blank');
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, query]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSearchClick = (searchQuery: string) => {
        setQuery(searchQuery);
        saveSearch(searchQuery);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    return (
        <div ref={searchRef} className="relative">
            {/* Search Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-black hover:text-white transition-all transform hover:scale-110 active:scale-95 relative group"
                aria-label="Search"
            >
                <Search className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Search Modal */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />

                    {/* Search Panel */}
                    <div className="fixed top-0 left-0 right-0 z-[70] bg-white border-b-4 border-black shadow-2xl animate-in slide-in-from-top duration-300">
                        <div className="max-w-5xl mx-auto p-6">
                            {/* Search Input */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1 relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary group-focus-within:text-accent transition-colors" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search 800+ articles across all categories..."
                                        className="w-full pl-14 pr-12 py-5 text-xl border-2 border-black focus:outline-none focus:border-accent focus:shadow-lg transition-all font-serif"
                                    />
                                    {isLoading && (
                                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 animate-spin text-accent" />
                                    )}
                                    {query && !isLoading && (
                                        <button
                                            onClick={() => setQuery('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-4 border-2 border-black hover:bg-black hover:text-white transition-all transform hover:scale-105 active:scale-95"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Search Results */}
                            <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                                {query.length >= 2 ? (
                                    results.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-black">
                                                <div className="text-sm font-black uppercase tracking-widest">
                                                    <span className="text-accent">{totalResults}</span> Result{totalResults !== 1 ? 's' : ''} Found
                                                </div>
                                                <div className="text-xs text-secondary">
                                                    Use ↑↓ arrows to navigate, Enter to open
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                {results.map((article, index) => (
                                                    <Link
                                                        key={article.id}
                                                        href={article.url}
                                                        target="_blank"
                                                        onClick={() => {
                                                            saveSearch(query);
                                                            setIsOpen(false);
                                                        }}
                                                        className={`block p-5 border-2 transition-all group ${selectedIndex === index
                                                            ? 'border-accent bg-accent/5 shadow-lg scale-[1.02]'
                                                            : 'border-border hover:border-black hover:bg-muted/30'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-black text-white">
                                                                {article.category}
                                                            </span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                                                {article.source}
                                                            </span>
                                                            <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-accent mb-2 transition-colors">
                                                            {article.title}
                                                        </h3>
                                                        {article.summary && (
                                                            <p className="text-sm text-secondary line-clamp-2 leading-relaxed">
                                                                {article.summary}
                                                            </p>
                                                        )}
                                                    </Link>
                                                ))}
                                            </div>
                                        </>
                                    ) : !isLoading && (
                                        <div className="text-center py-16">
                                            <Search className="w-16 h-16 mx-auto mb-6 opacity-20" />
                                            <p className="text-lg font-bold mb-2">No results found for "{query}"</p>
                                            <p className="text-sm text-secondary">Try different keywords or check spelling</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="space-y-8">
                                        {/* Recent Searches */}
                                        {recentSearches.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                        <Clock className="w-4 h-4" /> Recent Searches
                                                    </h4>
                                                    <button
                                                        onClick={clearRecentSearches}
                                                        className="text-xs text-secondary hover:text-accent transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {recentSearches.map((search, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleSearchClick(search)}
                                                            className="px-4 py-2 border border-border hover:border-black hover:bg-muted transition-all text-sm font-medium"
                                                        >
                                                            {search}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Popular Searches */}
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4" /> Popular Searches
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {POPULAR_SEARCHES.map((search, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSearchClick(search)}
                                                        className="px-4 py-2 bg-black text-white hover:bg-accent transition-all text-sm font-bold uppercase tracking-wider"
                                                    >
                                                        {search}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
