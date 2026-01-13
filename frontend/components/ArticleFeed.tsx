'use client';
import { useState, useEffect } from 'react';
import { NewsCard, LeadStory } from './EditorialComponents';
import LoadMoreButton from './LoadMoreButton';
import RecommendationRail from './RecommendationRail';
import type { Article } from '../app/page';
import { API_ENDPOINTS } from '../lib/config';

interface ArticleFeedProps {
    initialArticles: Article[];
    category?: string;
    showHero?: boolean;
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
            const url = new URL(API_ENDPOINTS.ARTICLES);
            url.searchParams.append('limit', ARTICLES_PER_PAGE.toString());
            url.searchParams.append('offset', offset.toString());
            if (category) url.searchParams.append('category', category);

            const res = await fetch(url.toString());
            if (!res.ok) {
                setHasMore(false);
                return;
            }

            const data = await res.json();
            const newArticles = data.articles || data || [];

            setArticles(prev => {
                const existingIds = new Set(prev.map(a => a.id));
                const uniqueNew = newArticles.filter((a: Article) => !existingIds.has(a.id));
                return [...prev, ...uniqueNew];
            });
            setTotalCount(data.total || totalCount);
            setHasMore(data.has_more || false);
            setOffset(prev => prev + ARTICLES_PER_PAGE);
        } catch (error) {
            console.error('Failed to load more articles:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    };

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
                    <NewsCard key={art.id || idx} article={art} />
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

            <LoadMoreButton
                onLoadMore={loadMore}
                isLoading={isLoading}
                hasMore={hasMore}
                currentCount={articles.length}
                totalCount={totalCount}
            />
        </>
    );
}
