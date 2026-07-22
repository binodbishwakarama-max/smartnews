'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Clock, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS } from '../../lib/config';
import type { Article } from '../../app/page';
import { useReader } from '../../contexts/ReaderContext';

interface MobileSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const POPULAR_SEARCHES = ['Climate', 'AI & Tech', 'Election', 'Markets', 'Sports', 'India'];

export default function MobileSearch({ isOpen, onClose }: MobileSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { openReader } = useReader();

    // Load recent search queries from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('smartnews_recent_searches');
            if (saved) {
                try { setRecentSearches(JSON.parse(saved)); } catch {}
            }
        }
    }, [isOpen]);

    const saveSearchQuery = (q: string) => {
        const trimmed = q.trim();
        if (!trimmed) return;
        const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
        setRecentSearches(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem('smartnews_recent_searches', JSON.stringify(updated));
        }
    };

    // Auto-focus input on open
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => inputRef.current?.focus(), 80);
            return () => clearTimeout(timer);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Google-style instant search debounced at 200ms
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            try {
                const searchUrl = `${API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(trimmed)}&limit=15`;
                const res = await fetch(searchUrl);
                if (res.ok) {
                    const data = await res.json();
                    const items = Array.isArray(data) ? data : (data.results || data.articles || []);
                    setResults(items);
                } else {
                    setResults([]);
                }
            } catch (err) {
                console.error('[Search] Fetch error:', err);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    const handleSelectResult = (article: Article) => {
        saveSearchQuery(query);
        onClose();
        openReader(article.id);
    };

    const handleSelectChip = (chip: string) => {
        setQuery(chip);
        saveSearchQuery(chip);
    };

    const clearRecent = () => {
        setRecentSearches([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('smartnews_recent_searches');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col select-none animate-in fade-in duration-200">
            {/* 1. Google-Style Top Search Input Bar */}
            <div className="h-16 px-4 border-b border-border flex items-center gap-3 bg-card dark:bg-slate-900 shrink-0 shadow-sm">
                <Search className="w-5 h-5 text-accent shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search global news, topics, sources..."
                    className="flex-1 bg-transparent text-primary text-base font-medium placeholder:text-secondary focus:outline-none"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="w-9 h-9 flex items-center justify-center rounded-full text-secondary hover:text-primary active:bg-muted"
                        aria-label="Clear Search"
                    >
                        <X className="w-4.5 h-4.5" />
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="h-9 px-3 flex items-center justify-center font-mono text-xs font-black uppercase text-accent hover:underline rounded-lg"
                >
                    Cancel
                </button>
            </div>

            {/* 2. Results & Suggestions Scroll View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">
                            Searching 800+ Verified Stories...
                        </span>
                    </div>
                ) : query.trim().length > 0 ? (
                    results.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-border">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">
                                    Found {results.length} Stories
                                </span>
                                <span className="text-[9px] font-mono text-accent">Tap to read full story</span>
                            </div>

                            {results.map((art) => (
                                <div
                                    key={art.id}
                                    onClick={() => handleSelectResult(art)}
                                    className="p-3.5 rounded-xl border border-border bg-card hover:border-accent active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-mono font-black uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded">
                                                {art.category || 'News'}
                                            </span>
                                            <span className="text-[10px] font-mono font-bold text-secondary uppercase truncate">
                                                {art.source}
                                            </span>
                                        </div>
                                        <h3 className="font-serif text-sm font-bold leading-snug text-primary group-hover:text-accent line-clamp-2">
                                            {art.title}
                                        </h3>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-secondary group-hover:text-accent shrink-0" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 space-y-3">
                            <Search className="w-12 h-12 text-secondary/30 mx-auto" />
                            <p className="text-sm font-bold text-primary">No stories matching &quot;{query}&quot;</p>
                            <p className="text-xs text-secondary">Try searching broader keywords like Climate, AI, or World</p>
                        </div>
                    )
                ) : (
                    /* Default Google-Style Suggestions View */
                    <div className="space-y-6 pt-2">
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> Recent Searches
                                    </span>
                                    <button
                                        onClick={clearRecent}
                                        className="text-[10px] font-mono text-secondary hover:text-accent"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectChip(s)}
                                            className="px-3.5 py-1.5 rounded-full bg-muted border border-border text-xs font-medium text-primary hover:border-accent active:scale-95 transition-all"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trending News Chips */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-accent" /> Trending Topics
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_SEARCHES.map((chip, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectChip(chip)}
                                        className="px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold text-accent hover:bg-accent hover:text-white active:scale-95 transition-all flex items-center gap-1.5"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        {chip}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
