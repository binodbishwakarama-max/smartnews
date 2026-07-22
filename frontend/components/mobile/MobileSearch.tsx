'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Clock, TrendingUp, Sparkles, ChevronRight, Filter } from 'lucide-react';
import { API_ENDPOINTS } from '../../lib/config';
import type { Article } from '../../app/page';
import { useReader } from '../../contexts/ReaderContext';

interface MobileSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

const POPULAR_SEARCHES = ['Climate', 'AI & Tech', 'Election', 'Markets', 'Sports', 'India', 'Space'];
const SEARCH_CATEGORIES = ['All', 'World', 'Technology', 'Business', 'Sports', 'Science', 'Health', 'Politics'];

export default function MobileSearch({ isOpen, onClose }: MobileSearchProps) {
    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
            setSelectedCategory('All');
        }
    }, [isOpen]);

    // Google-style tokenized instant search debounced at 150ms
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
                const catQuery = selectedCategory !== 'All' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
                const searchUrl = `${API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(trimmed)}&limit=25${catQuery}`;
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
        }, 150);

        return () => clearTimeout(timer);
    }, [query, selectedCategory]);

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
        <div className="fixed inset-0 z-50 bg-background flex flex-col select-none animate-in fade-in duration-200">
            {/* 1. Top Search Input Bar */}
            <div className="h-16 px-4 border-b border-border flex items-center gap-3 bg-card dark:bg-slate-900 shrink-0 shadow-sm">
                <Search className="w-5 h-5 text-accent shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search 800+ stories, topics, outlets..."
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

            {/* 2. In-Search Category Filter Pills */}
            <div className="px-4 py-2 bg-muted/40 border-b border-border flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                <Filter className="w-3.5 h-3.5 text-secondary shrink-0" />
                {SEARCH_CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                            selectedCategory === cat
                                ? 'bg-accent text-white shadow-sm font-black'
                                : 'bg-card border border-border text-secondary hover:text-primary'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* 3. Results & Suggestions Scroll View */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">
                            Searching Verified Outlets...
                        </span>
                    </div>
                ) : query.trim().length > 0 ? (
                    results.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-border">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary">
                                    {results.length} Matching Stori{results.length !== 1 ? 'es' : 'y'}
                                </span>
                                <span className="text-[9px] font-mono text-accent">Tap story to read</span>
                            </div>

                            {/* Rich Cards Stream */}
                            {results.map((art) => (
                                <div
                                    key={art.id}
                                    onClick={() => handleSelectResult(art)}
                                    className="p-3 rounded-2xl border border-border bg-card hover:border-accent active:scale-[0.99] transition-all cursor-pointer flex items-center gap-3.5 group shadow-sm"
                                >
                                    {/* Thumbnail Image */}
                                    {art.image_url ? (
                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40">
                                            <img
                                                src={art.image_url}
                                                alt={art.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20">
                                            <Search className="w-6 h-6 text-accent" />
                                        </div>
                                    )}

                                    {/* Content Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1 text-[9px] font-mono">
                                            <span className="font-black uppercase text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                                                {art.category || 'News'}
                                            </span>
                                            <span className="text-secondary font-bold truncate">
                                                {art.source} • {formatRelativeTime(art.publish_date)}
                                            </span>
                                        </div>

                                        <h3 className="font-serif text-sm font-bold leading-tight text-primary group-hover:text-accent line-clamp-2">
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
                            <p className="text-xs text-secondary">Try searching broader terms or switching category filters</p>
                        </div>
                    )
                ) : (
                    /* Default Suggestions View */
                    <div className="space-y-6 pt-2">
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-accent" /> Recent Searches
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
