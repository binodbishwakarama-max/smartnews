'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Article } from '../../app/page';
import MobileHeader from '../mobile/MobileHeader';
import MobileCategoryBar from '../mobile/MobileCategoryBar';
import MobileBottomNav from '../mobile/MobileBottomNav';
import MobileArticleCard from '../mobile/MobileArticleCard';
import MobileSearch from '../mobile/MobileSearch';
import Sidebar from '../Sidebar';
import { API_BASE_URL, API_ENDPOINTS } from '../../lib/config';
import { safeApiRequest } from '../../lib/api';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface MobileLayoutProps {
    articles: Article[];
    category?: string;
    onSelectCategory?: (cat: string) => void;
}

export default function MobileLayout({ articles: initialArticles, category, onSelectCategory }: MobileLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Infinite Scroll State
    const [feedArticles, setFeedArticles] = useState<Article[]>(initialArticles);
    const [offset, setOffset] = useState<number>(initialArticles.length);
    const [hasMore, setHasMore] = useState<boolean>(initialArticles.length >= 10);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Real-Time X.com Style New Stories Toast State
    const [newIncomingArticles, setNewIncomingArticles] = useState<Article[]>([]);

    // Reset stream when category or initial props change
    useEffect(() => {
        setFeedArticles(initialArticles);
        setOffset(initialArticles.length);
        setHasMore(initialArticles.length >= 10);
        setNewIncomingArticles([]);
    }, [category, initialArticles]);

    // Load More Articles Handler
    const fetchMoreArticles = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);

        try {
            const catParam = category && category !== 'Latest' && category !== 'For You'
                ? `&category=${encodeURIComponent(category)}`
                : '';
            const fetchUrl = `${API_ENDPOINTS.ARTICLES}?limit=20&offset=${offset}${catParam}`;
            const data = await safeApiRequest<{ articles?: Article[] } | Article[]>(fetchUrl, { skipRetry: true });

            if (data) {
                const fetched: Article[] = Array.isArray(data) ? data : (data.articles || []);
                if (fetched.length > 0) {
                    setFeedArticles(prev => {
                        const existingIds = new Set(prev.map(a => a.id));
                        const uniqueNew = fetched.filter(a => !existingIds.has(a.id));
                        return [...prev, ...uniqueNew];
                    });
                    setOffset(prev => prev + fetched.length);
                    if (fetched.length < 20) setHasMore(false);
                } else {
                    setHasMore(false);
                }
            }
        } catch (err) {
            console.error('[Mobile Feed] Failed to fetch next page:', err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, offset, category]);

    // IntersectionObserver for automatic infinite scrolling
    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    fetchMoreArticles();
                }
            },
            { rootMargin: '300px' }
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, fetchMoreArticles]);

    // SSE Real-Time Stream Connection (X.com Style updates)
    useEffect(() => {
        const streamUrl = `${API_BASE_URL}/api/v1/articles/stream`;
        let es: EventSource;

        function connect() {
            try {
                es = new EventSource(streamUrl);
                es.onmessage = (event) => {
                    try {
                        const article = JSON.parse(event.data) as Article;
                        setNewIncomingArticles(prev => {
                            if (prev.some(a => a.id === article.id) || feedArticles.some(a => a.id === article.id)) {
                                return prev;
                            }
                            return [article, ...prev];
                        });
                    } catch {}
                };
                es.onerror = () => {
                    es.close();
                };
            } catch {}
        }

        connect();
        return () => {
            if (es) es.close();
        };
    }, [feedArticles]);

    // Inject incoming real-time stories when user taps live banner
    const handleApplyLiveStories = () => {
        if (newIncomingArticles.length === 0) return;
        setFeedArticles(prev => [...newIncomingArticles, ...prev]);
        setNewIncomingArticles([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const leadArticle = feedArticles.length > 0 ? feedArticles[0] : null;
    const remainingArticles = feedArticles.length > 1 ? feedArticles.slice(1) : [];

    return (
        <div 
            className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white select-none max-w-full overflow-x-hidden"
            style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
            {/* 1. Compact Header */}
            <MobileHeader
                onOpenMenu={() => setIsMenuOpen(true)}
                onOpenSearch={() => setIsSearchOpen(true)}
            />

            {/* 2. Horizontal Category Pill Bar */}
            <MobileCategoryBar onSelectCategory={onSelectCategory} />

            {/* 3. Real-Time X.com Style Live Banner */}
            {newIncomingArticles.length > 0 && (
                <div className="sticky top-28 z-30 flex justify-center py-2 px-4 pointer-events-auto animate-in slide-in-from-top duration-300">
                    <button
                        onClick={handleApplyLiveStories}
                        className="px-4 py-2 rounded-full bg-accent text-white text-xs font-mono font-black uppercase tracking-wider shadow-xl flex items-center gap-2 active:scale-95 transition-transform border border-white/20"
                    >
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>{newIncomingArticles.length} New Stor{newIncomingArticles.length > 1 ? 'ies' : 'y'}</span>
                        <RefreshCw className="w-3 h-3 ml-1" />
                    </button>
                </div>
            )}

            {/* 4. Main Article Stream */}
            <main className="px-4 py-4 max-w-md mx-auto space-y-3">
                {category && category !== 'For You' && category !== 'Latest' && (
                    <div className="mb-3 border-b-2 border-brand pb-2 flex justify-between items-end">
                        <h2 className="text-xl font-serif font-black tracking-tighter uppercase text-primary">
                            {category}
                        </h2>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-secondary">
                            {feedArticles.length} Stories Loaded
                        </span>
                    </div>
                )}

                {/* Lead Article */}
                {leadArticle && (
                    <MobileArticleCard article={leadArticle} isLead={true} />
                )}

                {/* Remaining Articles */}
                <div className="space-y-3">
                    {remainingArticles.map((art) => (
                        <MobileArticleCard key={art.id || art.url} article={art} isLead={false} />
                    ))}
                </div>

                {/* Empty State */}
                {feedArticles.length === 0 && !isLoadingMore && (
                    <div className="text-center py-16 space-y-2 border-2 border-dashed border-border/80 rounded-2xl">
                        <p className="text-sm font-serif font-bold text-primary">No stories currently in this category</p>
                        <p className="text-xs text-secondary">Check back soon as our rolling ingestion scraper updates live.</p>
                    </div>
                )}

                {/* Infinite Scroll Loader Target */}
                <div ref={loadMoreRef} className="py-6 flex flex-col items-center justify-center gap-2">
                    {isLoadingMore && (
                        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-secondary">
                            <Loader2 className="w-4 h-4 animate-spin text-accent" />
                            <span>Loading More Stories...</span>
                        </div>
                    )}
                    {!hasMore && feedArticles.length > 0 && (
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-secondary/60">
                            • You are all caught up •
                        </span>
                    )}
                </div>
            </main>

            {/* 5. Native Bottom Navigation Bar */}
            <MobileBottomNav
                onOpenMenu={() => setIsMenuOpen(true)}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenPulse={() => setIsMenuOpen(true)}
            />

            {/* 6. Mobile Search Overlay */}
            <MobileSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />

            {/* 7. Mobile Navigation Drawer */}
            <Sidebar
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
        </div>
    );
}
