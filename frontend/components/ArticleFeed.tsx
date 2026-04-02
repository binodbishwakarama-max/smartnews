'use client';
import { useState, useEffect, useRef } from 'react';
import { NewsCard, LeadStory } from './EditorialComponents';
import dynamic from 'next/dynamic';

const RecommendationRail = dynamic(() => import('./RecommendationRail'), { ssr: false });
import type { Article } from '../app/page';
import { API_ENDPOINTS } from '../lib/config';
import { safeApiRequest } from '../lib/api';

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

export default function ArticleFeed({ initialArticles, category, showHero = false }: ArticleFeedProps) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialArticles.length >= ARTICLES_PER_PAGE);
    const [totalCount, setTotalCount] = useState(initialArticles.length * 2); // Estimate
    const [offset, setOffset] = useState(ARTICLES_PER_PAGE);

    // Reset state when category changes
    useEffect(() => {
        setArticles(initialArticles);
        setHasMore(initialArticles.length >= ARTICLES_PER_PAGE);
        setOffset(ARTICLES_PER_PAGE);
        setIsLoading(false);
    }, [category, initialArticles]);

    const loadMore = async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            const url = `${API_ENDPOINTS.ARTICLES}?limit=${ARTICLES_PER_PAGE}&offset=${offset}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
            const data = await safeApiRequest<ArticlesResponse | Article[]>(url, { skipRetry: true });

            if (!data) {
                setHasMore(false);
                return;
            }

            const newArticles = Array.isArray(data) ? data : data.articles || [];

            setArticles(prev => {
                const existingIds = new Set(prev.map(a => a.id));
                const uniqueNew = newArticles.filter((a: Article) => !existingIds.has(a.id));
                return [...prev, ...uniqueNew];
            });
            const nextTotal = Array.isArray(data) ? totalCount : data.total ?? totalCount;
            const nextHasMore = Array.isArray(data) ? false : data.has_more ?? false;
            setTotalCount(nextTotal);
            setHasMore(nextHasMore);
            setOffset(prev => prev + ARTICLES_PER_PAGE);
        } catch {
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    };

    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '400px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, isLoading, observerTarget]); // Re-run when state changes to ensure we capture latest closures if needed, though loadMore uses refs usually or state.

    // Determine which articles to show
    const displayArticles = showHero ? articles.slice(1) : articles;
    const heroArticle = showHero && articles.length > 0 ? articles[0] : null;

    // Split articles for rail injection
    const articlesBeforeRail = displayArticles.slice(0, RAIL_INSERT_POSITION);
    const articlesAfterRail = displayArticles.slice(RAIL_INSERT_POSITION);

    return (
        <>
            {heroArticle && (
                <div className="mb-12">
                    <LeadStory article={heroArticle} />
                </div>
            )}

            {/* First Block of Grid Articles */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 ${category ? 'py-4' : ''}`}>
                {articlesBeforeRail.map((art, idx) => (
                    <NewsCard key={art.id || `before-${idx}`} article={art} />
                ))}
            </div>

            {/* Premium Recommendation Rail (Only show on homepage/first load to avoid clutter) */}
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
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 mt-16`}>
                    {articlesAfterRail.map((art, idx) => (
                        <NewsCard key={art.id || `after-${idx}`} article={art} />
                    ))}
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
                {!hasMore && articles.length > 0 && (
                    <div className="text-center text-gray-500 py-8">
                        <p className="text-sm tracking-widest uppercase">You&apos;re all caught up</p>
                    </div>
                )}
            </div>
        </>
    );
}
