'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Clock, TrendingUp, ArrowRight, ExternalLink } from 'lucide-react';
import { API_ENDPOINTS } from '../lib/config';
import { apiRequest } from '../lib/api';
import { useReader } from '../contexts/ReaderContext';

interface SearchResult {
    id: number;
    title: string;
    summary: string;
    category: string;
    source: string;
    url: string;
    image_url?: string;
    publish_date: string;
}

const POPULAR_SEARCHES = ['Climate Change', 'AI Technology', 'Sports News', 'Politics', 'Health', 'Markets'];

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
    const { openReader } = useReader();

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            try { setRecentSearches(JSON.parse(saved)); } catch {}
        }
    }, []);

    // Save search to recent searches
    const saveSearch = (searchQuery: string) => {
        const trimmed = searchQuery.trim();
        if (!trimmed) return;
        const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    // Debounced search
    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setSelectedIndex(-1);
            setIsLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const searchUrl = `${API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(query.trim())}&limit=15`;
                const data = await apiRequest<{ results: SearchResult[], articles?: SearchResult[], total: number }>(searchUrl);
                const items = data.results || data.articles || [];
                setResults(items);
                setTotalResults(data.total || items.length);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 150);

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
                    openReader(selected.id);
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, query, openReader]);

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

    const handleResultClick = (article: SearchResult) => {
        saveSearch(query);
        setIsOpen(false);
        openReader(article.id);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const formatRelativeTime = (dateStr?: string) => {
        if (!dateStr) return 'Recently';
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    return (
        <div ref={searchRef} className="relative">
            {/* Search Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all transform active:scale-95 relative group rounded-lg border border-border/40"
                aria-label="Search"
            >
                <Search className="w-5 h-5" />
            </button>

            {/* Search Modal */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />

                    {/* Search Panel */}
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-4xl z-[70] bg-card dark:bg-slate-900 border-2 border-border dark:border-slate-700 shadow-2xl rounded-2xl animate-in slide-in-from-top duration-300 overflow-hidden">
                        <div className="p-6">
                            {/* Search Input Bar */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1 relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-accent transition-colors" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search 800+ articles across all categories..."
                                        className="w-full pl-12 pr-12 py-4 text-lg border-2 border-border focus:border-accent dark:border-slate-700 dark:focus:border-accent rounded-xl bg-background text-primary focus:outline-none transition-all font-serif"
                                    />
                                    {isLoading && (
                                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-accent" />
                                    )}
                                    {query && !isLoading && (
                                        <button
                                            onClick={() => setQuery('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-3.5 rounded-xl border border-border hover:bg-muted text-primary transition-all active:scale-95"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Results / Suggestions View */}
                            <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                                {query.trim().length >= 2 ? (
                                    results.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border text-xs font-mono">
                                                <div className="font-bold uppercase tracking-widest text-secondary">
                                                    <span className="text-accent">{totalResults}</span> Result{totalResults !== 1 ? 's' : ''} Found
                                                </div>
                                                <div className="text-secondary opacity-70">
                                                    Use ↑↓ arrows to navigate, Enter or Click to read story
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {results.map((article, index) => (
                                                    <div
                                                        key={article.id}
                                                        onClick={() => handleResultClick(article)}
                                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 group ${
                                                            selectedIndex === index
                                                                ? 'border-accent bg-accent/5 shadow-md'
                                                                : 'border-border hover:border-accent hover:bg-muted/40'
                                                        }`}
                                                    >
                                                        {article.image_url ? (
                                                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40">
                                                                <img
                                                                    src={article.image_url}
                                                                    alt={article.title}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-20 h-20 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
                                                                <Search className="w-6 h-6 text-accent" />
                                                            </div>
                                                        )}

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5 text-[10px] font-mono">
                                                                <span className="font-black uppercase text-accent bg-accent/10 px-2 py-0.5 rounded">
                                                                    {article.category}
                                                                </span>
                                                                <span className="font-bold text-secondary uppercase truncate">
                                                                    {article.source} • {formatRelativeTime(article.publish_date)}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-serif text-lg font-bold leading-snug group-hover:text-accent transition-colors line-clamp-1">
                                                                {article.title}
                                                            </h3>
                                                            {article.summary && (
                                                                <p className="text-xs text-secondary line-clamp-2 mt-1 leading-relaxed">
                                                                    {article.summary}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <ArrowRight className="w-5 h-5 text-secondary group-hover:text-accent shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : !isLoading && (
                                        <div className="text-center py-16">
                                            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            <p className="text-base font-bold mb-1">No results found for &quot;{query}&quot;</p>
                                            <p className="text-xs text-secondary">Try searching broader keywords like Climate, AI, or World</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="space-y-6">
                                        {/* Recent Searches */}
                                        {recentSearches.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-xs font-mono font-black uppercase tracking-widest flex items-center gap-2 text-secondary">
                                                        <Clock className="w-4 h-4 text-accent" /> Recent Searches
                                                    </h4>
                                                    <button
                                                        onClick={clearRecentSearches}
                                                        className="text-xs font-mono text-secondary hover:text-accent transition-colors"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {recentSearches.map((search, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleSearchClick(search)}
                                                            className="px-4 py-2 rounded-full border border-border hover:border-accent hover:bg-muted text-xs font-medium text-primary transition-all"
                                                        >
                                                            {search}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Popular Searches */}
                                        <div>
                                            <h4 className="text-xs font-mono font-black uppercase tracking-widest mb-3 flex items-center gap-2 text-secondary">
                                                <TrendingUp className="w-4 h-4 text-accent" /> Popular Searches
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {POPULAR_SEARCHES.map((search, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSearchClick(search)}
                                                        className="px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
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
