'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { NewsCard, LeadStory, BBCTopHeroGrid } from './EditorialComponents';
import dynamic from 'next/dynamic';

const RecommendationRail = dynamic(() => import('./RecommendationRail'), { ssr: false });
import type { Article } from '../app/page';
import { API_ENDPOINTS, API_BASE_URL } from '../lib/config';
import { safeApiRequest } from '../lib/api';
import { Radio, Zap, Keyboard, X } from 'lucide-react';
import { useReader } from '../contexts/ReaderContext';
import { useBookmarks } from '../contexts/BookmarkContext';

interface ArticleFeedProps {
    initialArticles: Article[];
    category?: string;
    showHero?: boolean;
}

interface ArticlesResponse {
    articles?: Article[];
    total?: number;
    has_more?: boolean;
}

const ARTICLES_PER_PAGE = 20;
const RAIL_INSERT_POSITION = 6; // Insert rail after 6th grid item

// How many new articles queue up before auto-inserting (0 = instant auto-insert)
const AUTO_INSERT_THRESHOLD = 3;

const STATIC_FALLBACK_ARTICLES: Article[] = [
    {
        id: -1,
        title: "Global Tech Summit: Next-Generation Artificial Intelligence Takes Center Stage",
        content: "The annual Global Tech Summit kicked off with industry leaders showcasing breakthroughs in autonomous agents, large multimodal models, and hardware acceleration. Keynotes highlighted the transition from simple generative chatbots to agentic workflows that act autonomously on behalf of users.",
        summary: "Industry leaders showcase breakthrough AI agentic workflows and next-gen hardware accelerators at Global Tech Summit.",
        url: "https://example.com/tech-summit",
        image_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop",
        category: "Technology",
        source: "Tech Journal",
        publish_date: new Date().toISOString(),
        quality_score: 9.2
    },
    {
        id: -2,
        title: "Global Energy Markets Pivot Toward Next-Gen Solar Grid Infrastructures",
        content: "Investment in solar energy transmission infrastructure has hit record highs this quarter. Researchers have successfully deployed high-efficiency perovskite-silicon tandem solar panels on a commercial scale, promising to boost yield by up to thirty percent across major national grid nodes.",
        summary: "Commercial deployment of tandem perovskite-silicon solar cells drives record-high investments in grid infrastructure.",
        url: "https://example.com/solar-infrastructure",
        image_url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1000&auto=format&fit=crop",
        category: "Science",
        source: "Science Wire",
        publish_date: new Date().toISOString(),
        quality_score: 8.9
    },
    {
        id: -3,
        title: "Global Markets Stabilize as Inflation Returns to Target Ranges",
        content: "Leading central banks report inflation rates have stabilized within target bands, prompting speculation of synchronized interest rate cuts. Global stock indexes surged in early trading following the announcements, led by technology and infrastructure sectors.",
        summary: "Central banks report inflation stabilization within target bands, triggering stock market gains.",
        url: "https://example.com/market-stabilization",
        image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1000&auto=format&fit=crop",
        category: "Business",
        source: "Financial Post",
        publish_date: new Date().toISOString(),
        quality_score: 8.5
    },
    {
        id: -4,
        title: "Deep Space Telescope Uncovers Planetary System with Multiple Ocean Worlds",
        content: "Astronomers utilizing the latest deep space telescope array have identified a neighboring stellar system hosting three terrestrial planets orbiting inside the star's habitable zone. Spectroscopic analysis suggests all three planets possess active water vapour atmospheres and potential global oceans.",
        summary: "Deep space telescope discovers a stellar system with three terrestrial ocean planets in the habitable zone.",
        url: "https://example.com/ocean-worlds-discovered",
        image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
        category: "Science",
        source: "Cosmos Daily",
        publish_date: new Date().toISOString(),
        quality_score: 9.5
    }
];

export default function ArticleFeed({ initialArticles, category, showHero = false }: ArticleFeedProps) {
    const [isUsingFallback, setIsUsingFallback] = useState(initialArticles.length === 0);
    const [articles, setArticles] = useState<Article[]>(
        initialArticles.length > 0 ? initialArticles : STATIC_FALLBACK_ARTICLES
    );
    const [incomingArticles, setIncomingArticles] = useState<Article[]>([]);
    const [justInsertedIds, setJustInsertedIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(initialArticles.length > 0 ? initialArticles.length * 2 : 10);
    const [offset, setOffset] = useState(ARTICLES_PER_PAGE);
    const [liveConnected, setLiveConnected] = useState(false);
    const [liveCount, setLiveCount] = useState(0); // total articles received via SSE this session

    // X.com Polish Keyboard Nav States & Refs
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const { openReader } = useReader();
    const { toggleBookmark, isBookmarked } = useBookmarks();
    const cardRefs = useRef<React.RefObject<HTMLDivElement | null>[]>([]);
    const articlesRef = useRef<Article[]>(articles);
    useEffect(() => {
        articlesRef.current = articles;
    }, [articles]);

    if (cardRefs.current.length !== articles.length) {
        cardRefs.current = Array(articles.length)
            .fill(null)
            .map((_, i) => cardRefs.current[i] || { current: null });
    }

    // Instant client-side feedback & state reset when category changes
    useEffect(() => {
        const hasArticles = initialArticles.length > 0;
        setIsUsingFallback(!hasArticles);
        
        if (hasArticles) {
            setArticles(initialArticles);
        } else if (category && category !== 'Latest' && category !== 'For You') {
            // Immediate client-side filtering for zero-latency response on tap
            const localMatches = articlesRef.current.filter(a => 
                a.category && a.category.toLowerCase().includes(category.toLowerCase())
            );
            setArticles(localMatches.length > 0 ? localMatches : STATIC_FALLBACK_ARTICLES);
        } else {
            setArticles(STATIC_FALLBACK_ARTICLES);
        }

        setIncomingArticles([]);
        setJustInsertedIds(new Set());
        setHasMore(true);
        setOffset(ARTICLES_PER_PAGE);
        setIsLoading(false);
        setSelectedIndex(null);
    }, [category, initialArticles]);

    // Keyboard navigation event handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            if (
                activeEl && 
                (activeEl.tagName === 'INPUT' || 
                 activeEl.tagName === 'TEXTAREA' || 
                 activeEl.getAttribute('contenteditable') === 'true')
            ) {
                return;
            }

            const key = e.key.toLowerCase();

            if (e.key === '?') {
                e.preventDefault();
                setShowShortcutsHelp(prev => !prev);
                return;
            }

            if (key === 'j') {
                e.preventDefault();
                setSelectedIndex(prev => {
                    const next = prev === null ? 0 : Math.min(articles.length - 1, prev + 1);
                    setTimeout(() => {
                        const target = cardRefs.current[next]?.current;
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 50);
                    return next;
                });
            } else if (key === 'k') {
                e.preventDefault();
                setSelectedIndex(prev => {
                    const next = prev === null ? 0 : Math.max(0, prev - 1);
                    setTimeout(() => {
                        const target = cardRefs.current[next]?.current;
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 50);
                    return next;
                });
            } else if (key === 'o' || e.key === 'Enter') {
                if (selectedIndex !== null && articles[selectedIndex]) {
                    e.preventDefault();
                    openReader(articles[selectedIndex].id);
                }
            } else if (key === 'l') {
                if (selectedIndex !== null && articles[selectedIndex]) {
                    e.preventDefault();
                    const art = articles[selectedIndex];
                    void toggleBookmark(art);
                    
                    const isAdded = !isBookmarked(art.id);
                    const toast = document.createElement('div');
                    toast.textContent = isAdded ? '📌 Saved to Bookmarks' : '🗑️ Removed Bookmark';
                    toast.style.cssText = 'position:fixed;bottom:24px;left:24px;background:#111;color:#fff;padding:10px 18px;font-size:11px;font-family:monospace;font-weight:700;letter-spacing:0.1em;z-index:9999;border:1px solid #333;box-shadow:4px 4px 0px 0px #e11d48;';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 1800);
                }
            } else if (key === 's') {
                if (selectedIndex !== null && articles[selectedIndex]) {
                    e.preventDefault();
                    const art = articles[selectedIndex];
                    const shareData = { title: art.title, url: art.url, text: art.summary || art.title };
                    void (async () => {
                        try {
                            if (navigator.share && navigator.canShare?.(shareData)) {
                                await navigator.share(shareData);
                            } else {
                                await navigator.clipboard.writeText(art.url);
                                const toast = document.createElement('div');
                                toast.textContent = '🔗 Link copied to clipboard!';
                                toast.style.cssText = 'position:fixed;bottom:24px;left:24px;background:#111;color:#fff;padding:10px 18px;font-size:11px;font-family:monospace;font-weight:700;letter-spacing:0.1em;z-index:9999;border:1px solid #333;box-shadow:4px 4px 0px 0px #e11d48;';
                                document.body.appendChild(toast);
                                setTimeout(() => toast.remove(), 1800);
                            }
                        } catch {}
                    })();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [articles, selectedIndex, openReader, toggleBookmark, isBookmarked]);


    // Auto-insert articles that have queued up
    const flushIncoming = useCallback(() => {
        setIncomingArticles(prevIncoming => {
            if (prevIncoming.length === 0) return prevIncoming;
            const ids = new Set(prevIncoming.map(a => a.id));
            setJustInsertedIds(ids);
            setArticles(prev => {
                const existingIds = new Set(prev.map(a => a.id));
                const toInsert = prevIncoming.filter(a => !existingIds.has(a.id));
                return [...toInsert, ...prev];
            });
            // Clear the flash effect after 2.5s
            setTimeout(() => setJustInsertedIds(new Set()), 2500);
            return [];
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const [triggerReload, setTriggerReload] = useState(0);
    const isUsingFallbackRef = useRef(isUsingFallback);
    useEffect(() => {
        isUsingFallbackRef.current = isUsingFallback;
    }, [isUsingFallback]);

    // Real-time EventSource listener
    useEffect(() => {
        const streamUrl = `${API_BASE_URL}/api/v1/articles/stream`;
        let eventSource: EventSource;
        let reconnectDelay = 1000;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let mounted = true;

        function connect() {
            eventSource = new EventSource(streamUrl);

            eventSource.onopen = () => {
                if (!mounted) return;
                setLiveConnected(true);
                reconnectDelay = 1000; // reset backoff on successful connection
                if (isUsingFallbackRef.current) {
                    setTriggerReload(prev => prev + 1);
                }
            };

            eventSource.onmessage = (event) => {
                if (!mounted) return;
                try {
                    const newArticle = JSON.parse(event.data) as Article;

                    // Filter by category if viewing a category feed
                    if (category && category.toLowerCase() !== 'all') {
                        const match = newArticle.category.toLowerCase().includes(category.toLowerCase());
                        if (!match) return;
                    }

                    setLiveCount(c => c + 1);

                    const exists = articlesRef.current.some(a => a.id === newArticle.id);
                    if (exists) return;

                    setIncomingArticles(prevIncoming => {
                        const incomingExists = prevIncoming.some(a => a.id === newArticle.id);
                        if (incomingExists) return prevIncoming;
                        const next = [newArticle, ...prevIncoming];

                        // Auto-insert immediately when we hit the threshold
                        if (next.length >= AUTO_INSERT_THRESHOLD) {
                            // Schedule flush outside this render cycle
                            setTimeout(() => {
                                setIncomingArticles(q => {
                                    if (q.length === 0) return q;
                                    const ids = new Set(q.map(a => a.id));
                                    setJustInsertedIds(ids);
                                    setArticles(prev => {
                                        const existingIds = new Set(prev.map(a => a.id));
                                        const toInsert = q.filter(a => !existingIds.has(a.id));
                                        return [...toInsert, ...prev];
                                    });
                                    setTimeout(() => setJustInsertedIds(new Set()), 2500);
                                    return [];
                                });
                            }, 0);
                        }

                        return next;
                    });
                } catch (err) {
                    console.error('Error parsing real-time article event:', err);
                }
            };

            eventSource.onerror = () => {
                if (!mounted) return;
                setLiveConnected(false);
                eventSource.close();
                // Exponential backoff reconnection
                reconnectTimer = setTimeout(() => {
                    if (mounted) {
                        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
                        connect();
                    }
                }, reconnectDelay);
            };
        }

        connect();

        return () => {
            mounted = false;
            setLiveConnected(false);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            eventSource?.close();
        };
    }, [category]);

    const loadMore = async () => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            if (isUsingFallback) {
                const url = `${API_ENDPOINTS.ARTICLES}?limit=${ARTICLES_PER_PAGE}&offset=0${category ? `&category=${encodeURIComponent(category)}` : ''}`;
                const data = await safeApiRequest<ArticlesResponse | Article[]>(url, { skipRetry: true });
                if (data) {
                    const newArticles = Array.isArray(data) ? data : data.articles || [];
                    if (newArticles.length > 0) {
                        setArticles(newArticles);
                        setIsUsingFallback(false);
                        setOffset(ARTICLES_PER_PAGE);
                        const nextTotal = Array.isArray(data) ? ARTICLES_PER_PAGE : data.total ?? ARTICLES_PER_PAGE;
                        setTotalCount(nextTotal);
                    }
                }
                return;
            }

            let currentOffset = offset;
            if (totalCount > 0 && currentOffset >= totalCount) {
                currentOffset = 0;
            }

            const url = `${API_ENDPOINTS.ARTICLES}?limit=${ARTICLES_PER_PAGE}&offset=${currentOffset}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
            const data = await safeApiRequest<ArticlesResponse | Article[]>(url, { skipRetry: true });

            if (!data) return;

            let newArticles = Array.isArray(data) ? data : data.articles || [];

            if (newArticles.length === 0 && currentOffset > 0) {
                const retryUrl = `${API_ENDPOINTS.ARTICLES}?limit=${ARTICLES_PER_PAGE}&offset=0${category ? `&category=${encodeURIComponent(category)}` : ''}`;
                const retryData = await safeApiRequest<ArticlesResponse | Article[]>(retryUrl, { skipRetry: true });
                newArticles = retryData ? (Array.isArray(retryData) ? retryData : retryData.articles || []) : [];
                currentOffset = 0;
            }

            if (newArticles.length > 0) {
                setArticles(prev => [...prev.filter(a => a.id >= 0), ...newArticles]);
                const nextTotal = Array.isArray(data) ? totalCount : data.total ?? totalCount;
                setTotalCount(nextTotal);
                setOffset(currentOffset + ARTICLES_PER_PAGE);
            } else {
                if (articles.filter(a => a.id >= 0).length === 0) {
                    setHasMore(false);
                }
            }
        } catch {
            // Keep hasMore true for retry
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (triggerReload > 0 && isUsingFallback) {
            void loadMore();
        }
    }, [triggerReload]);

    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '600px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, isLoading, observerTarget]);

    const displayArticles = showHero ? articles.slice(1) : articles;
    const heroArticle = showHero && articles.length > 0 ? articles[0] : null;

    const articlesBeforeRail = displayArticles.slice(0, RAIL_INSERT_POSITION);
    const articlesAfterRail = displayArticles.slice(RAIL_INSERT_POSITION);

    return (
        <>
            {/* ── Live Status Bar ── */}
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                <span className="flex items-center gap-1.5">
                    <span
                        className={`w-2 h-2 rounded-full ${liveConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400 animate-pulse'}`}
                    />
                    <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${liveConnected ? 'text-green-600 dark:text-green-400' : 'text-red-400'}`}>
                        {liveConnected ? 'Live' : 'Backend Wake-up Sequence (Showing Cached Stories)...'}
                    </span>
                </span>
                {isUsingFallback && (
                    <span className="text-[9px] font-mono text-red-500 font-bold uppercase tracking-widest animate-pulse border border-red-500/25 px-1.5 py-0.5 bg-red-500/5">
                        Offline Preview Mode
                    </span>
                )}
                {liveCount > 0 && (
                    <span className="text-[9px] font-mono text-secondary uppercase tracking-widest">
                        +{liveCount} ingested this session
                    </span>
                )}
                <span className="ml-auto text-[9px] font-mono text-secondary uppercase tracking-widest hidden sm:block">
                    Continuous ingestion · Sources rotate every ~56s
                </span>
            </div>

            {/* ── Incoming Articles Notification (queued but under threshold) ── */}
            {incomingArticles.length > 0 && incomingArticles.length < AUTO_INSERT_THRESHOLD && (
                <div className="flex justify-center mb-8 sticky top-24 z-40">
                    <button
                        onClick={flushIncoming}
                        className="flex items-center gap-2.5 px-6 py-3 bg-accent text-white font-mono font-black text-[10px] uppercase tracking-widest rounded-none border-2 border-brand shadow-[4px_4px_0px_0px_var(--color-brand)] dark:shadow-[4px_4px_0px_0px_var(--color-border)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                    >
                        <Radio className="w-4 h-4 text-white animate-pulse" />
                        {incomingArticles.length === 1
                            ? 'LIVE INGEST // 1 NEW STORY — TAP TO READ'
                            : `LIVE INGEST // ${incomingArticles.length} NEW STORIES — TAP TO READ`}
                        <Zap className="w-3.5 h-3.5 text-white/90" />
                    </button>
                </div>
            )}

            {showHero && heroArticle && (
                <BBCTopHeroGrid 
                    leadArticle={heroArticle} 
                    sideArticles={articles.slice(1, 4)}
                />
            )}

            {/* First Block of Grid Articles */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 ${category ? 'py-4' : ''}`}>
                {articlesBeforeRail.map((art, idx) => {
                    const idxInArticles = showHero ? idx + 1 : idx;
                    return (
                        <div
                            key={`before-${art.id}-${idx}`}
                            className={justInsertedIds.has(art.id) ? 'animate-live-flash' : ''}
                        >
                            <NewsCard 
                                article={art} 
                                isSelected={selectedIndex === idxInArticles}
                                indexRef={cardRefs.current[idxInArticles]}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Premium Recommendation Rail */}
            {!category && displayArticles.length >= RAIL_INSERT_POSITION && (
                <div className="full-width-breakout">
                    <RecommendationRail
                        currentCategory={category}
                        excludeIds={articles.map(a => a.id)}
                    />
                </div>
            )}

            {/* Remaining Grid Articles */}
            {articlesAfterRail.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 mt-12">
                    {articlesAfterRail.map((art, idx) => {
                        const idxInArticles = showHero 
                            ? idx + 1 + articlesBeforeRail.length 
                            : idx + articlesBeforeRail.length;
                        return (
                            <div
                                key={`after-${art.id}-${idx}`}
                                className={justInsertedIds.has(art.id) ? 'animate-live-flash' : ''}
                            >
                                <NewsCard 
                                    article={art} 
                                    isSelected={selectedIndex === idxInArticles}
                                    indexRef={cardRefs.current[idxInArticles]}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Infinite Scroll Sentinel & Loader */}
            <div ref={observerTarget} className="py-12 flex justify-center w-full">
                {isLoading && (
                    <div className="flex items-center space-x-2 text-accent-500">
                        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium tracking-wide uppercase">Discovering More...</span>
                    </div>
                )}
                {!hasMore && articles.length === 0 && (
                    <div className="text-center text-secondary py-8">
                        <p className="text-sm tracking-widest uppercase">No articles available</p>
                    </div>
                )}
            </div>
        </>
    );
}
