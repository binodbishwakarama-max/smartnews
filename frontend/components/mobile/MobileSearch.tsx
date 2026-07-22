'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { API_ENDPOINTS } from '../../lib/config';
import type { Article } from '../../app/page';
import { useReader } from '../../contexts/ReaderContext';

interface MobileSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileSearch({ isOpen, onClose }: MobileSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { openReader } = useReader();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${API_ENDPOINTS.ARTICLES}/search?q=${encodeURIComponent(query)}&limit=15`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(Array.isArray(data) ? data : data.results || []);
                }
            } catch (err) {
                console.error('Mobile search error:', err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col select-none animate-in fade-in duration-200">
            {/* Header Input Bar */}
            <div className="h-16 px-4 border-b border-border flex items-center gap-3 bg-card dark:bg-paper shrink-0">
                <Search className="w-5 h-5 text-secondary shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search global news, topics, authors..."
                    className="flex-1 bg-transparent text-primary text-base font-medium placeholder:text-secondary focus:outline-none"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-secondary hover:text-primary"
                        aria-label="Clear Search"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="h-10 px-3 flex items-center justify-center font-mono text-xs font-black uppercase text-accent hover:underline"
                >
                    Cancel
                </button>
            </div>

            {/* Results Scroll List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">Searching Newsroom...</span>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary border-b border-border pb-1 block">
                            Found {results.length} Stories
                        </span>
                        {results.map((art) => (
                            <div
                                key={art.id}
                                onClick={() => {
                                    openReader(art.id);
                                    onClose();
                                }}
                                className="p-3 bg-card dark:bg-paper border border-border/80 rounded-xl hover:border-accent/40 active:bg-muted/40 transition-all flex items-center justify-between gap-3 cursor-pointer"
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-secondary">
                                        <span className="font-bold text-accent">{art.source}</span>
                                        <span>• {art.category}</span>
                                    </div>
                                    <h4 className="text-xs font-serif font-bold text-primary leading-snug line-clamp-2">
                                        {art.title}
                                    </h4>
                                </div>
                                <ArrowRight className="w-4 h-4 text-secondary shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : query.trim() ? (
                    <div className="text-center py-16 space-y-2">
                        <p className="text-sm font-serif font-bold text-primary">No stories found for "{query}"</p>
                        <p className="text-xs text-secondary">Try searching for keywords like "climate", "AI", "politics", or "cricket".</p>
                    </div>
                ) : (
                    <div className="py-8 space-y-4">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary block">
                            Popular Topics
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {['Artificial Intelligence', 'Global Markets', 'Cricket', 'Space Exploration', 'Climate Change', 'US Politics'].map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => setQuery(tag)}
                                    className="px-3 py-1.5 bg-muted rounded-full text-xs font-mono font-medium text-secondary hover:text-primary active:scale-95 transition-transform"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
