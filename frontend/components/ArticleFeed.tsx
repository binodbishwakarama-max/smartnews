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
    const [hasMore, setHasMore] = useState(true); // Always true for X-like infinite scrolling
    const [totalCount, setTotalCount] = useState(initialArticles.length * 2); // Estimate
    const [offset, setOffset] = useState(ARTICLES_PER_PAGE);

    // Reset state when category changes
    useEffect(() => {
        setArticles(initialArticles);
        setHasMore(true);
        setOffset(ARTICLES_PER_PAGE);
        setIsLoading(false);
    }, [category, initialArticles]);

    const loadMore = async () => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            let currentOffset = offset;
            // If we have hit or exceeded the known total count, cycle back to the beginning
            if (totalCount > 0 && currentOffset >= totalCount) {
                currentOffset = 0;
            }

            const url = `${API_ENDPOINTS.ARTICLES}?limit=${ARTICLES_PER_PAGE}&offset=${currentOffset}${category ? `&category=${encodeURIComponent(category)}` : ''}`;
            const data = await safeApiRequest<ArticlesResponse | Article[]>(url, { skipRetry: true });

            if (!data) {
                return;
            }

            let newArticles = Array.isArray(data) ? data : data.articles || [];

            // If the endpoint returns no articles (e.g. database cleared or exact offset mismatch),
            // cycle to offset 0 and try loading the first page again
            if (newArticles.length === 0 && currentOffset > 0) {
                const retryUrl = `${API_ENDPOINTS.ARTICLES}?limit=${ARTICLES_PER_PAGE}&offset=0${category ? `&category=${encodeURIComponent(category)}` : ''}`;
                const retryData = await safeApiRequest<ArticlesResponse | Article[]>(retryUrl, { skipRetry: true });
                newArticles = retryData ? (Array.isArray(retryData) ? retryData : retryData.articles || []) : [];
                currentOffset = 0;
            }

            if (newArticles.length > 0) {
                // Append all newly fetched articles (allowing duplicates in infinite scrolling cycle)
                setArticles(prev => [...prev, ...newArticles]);
                
                const nextTotal = Array.isArray(data) ? totalCount : data.total ?? totalCount;
                setTotalCount(nextTotal);
                setOffset(currentOffset + ARTICLES_PER_PAGE);
            } else {
                // If there are literally 0 articles in the database for this query/category, stop loading
                if (articles.length === 0) {
                    setHasMore(false);
                }
            }
        } catch {
            // Keep hasMore true so we can retry on next scroll attempt/intersection
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
            { threshold: 0.1, rootMargin: '600px' } // Increased rootMargin for a smoother pre-load experience
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
                    <NewsCard key={`before-${art.id}-${idx}`} article={art} />
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
                        <NewsCard key={`after-${art.id}-${idx}`} article={art} />
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
                {!hasMore && articles.length === 0 && (
                    <div className="text-center text-secondary py-8">
                        <p className="text-sm tracking-widest uppercase">No articles available</p>
                    </div>
                )}
            </div>
        </>
    );
}
