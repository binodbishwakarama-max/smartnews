'use client';
import { useEffect, useState, useRef } from 'react';
import { Article } from '../app/page';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { formatDate } from '../lib/dateUtils';
import BookmarkButton from './BookmarkButton';
import { API_ENDPOINTS } from '../lib/config';

interface RecommendationRailProps {
    currentCategory?: string;
    excludeIds?: number[];
}

export default function RecommendationRail({ currentCategory, excludeIds = [] }: RecommendationRailProps) {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchRecommendations() {
            try {
                // Fetch more articles than needed to allow for filtering
                const url = new URL(API_ENDPOINTS.ARTICLES);
                url.searchParams.append('limit', '30');
                // If we have a category, maybe fetch from a different one for variety, or same for relevance.
                // Let's go with "Top Rated" mostly, so we just fetch general recent ones for now
                // but ideally we'd sort by quality_score if the API supported sorting.

                const res = await fetch(url.toString());
                if (!res.ok) throw new Error('Failed to fetch');

                const data = await res.json();
                const allArticles: Article[] = data.articles || [];

                // Smart Filter:
                // 1. Exclude current articles (excludeIds)
                // 2. Prioritize articles with images
                // 3. If currentCategory exists, bias slightly towards it, OR offer diversity.
                // Let's offer "Trending Now" - high quality, visual articles.

                const filtered = allArticles
                    .filter(a => !excludeIds.includes(a.id))
                    .filter(a => a.image_url) // Must have image for the rail
                    .slice(0, 10); // Top 10

                setArticles(filtered);
            } catch (error) {
                console.error("Failed to load recommendations", error);
            } finally {
                setLoading(false);
            }
        }

        fetchRecommendations();
    }, [currentCategory, excludeIds]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth * 0.8; // Scroll 80% of width

        container.scrollBy({
            left: direction === 'right' ? scrollAmount : -scrollAmount,
            behavior: 'smooth'
        });
    };

    if (!loading && articles.length === 0) return null;

    return (
        <section className="py-12 border-y border-border bg-paper dark:bg-muted/30 my-16 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-accent mb-2">
                            <Sparkles className="w-4 h-4" />
                            Curated For You
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif font-black">
                            Trending Stories
                        </h2>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 hidden md:flex">
                        <button
                            onClick={() => scroll('left')}
                            className="p-3 rounded-full border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-3 rounded-full border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Horizontal Scroll Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 -mb-8 scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {loading ? (
                        // Skeletons
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="min-w-[280px] md:min-w-[320px] h-[400px] bg-muted animate-pulse rounded-lg" />
                        ))
                    ) : (
                        articles.map(article => (
                            <div
                                key={article.id}
                                className="min-w-[280px] md:min-w-[320px] snap-start group relative flex flex-col"
                            >
                                <div className="aspect-[3/4] overflow-hidden bg-muted mb-4 relative rounded-lg">
                                    <img
                                        src={article.image_url}
                                        alt={article.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <BookmarkButton article={article} className="bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-full shadow-lg p-1.5" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Read Now</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                                        {article.category}
                                    </span>
                                    <h3 className="text-xl font-serif font-bold leading-tight group-hover:underline line-clamp-2">
                                        <Link href={article.url} target="_blank">{article.title}</Link>
                                    </h3>
                                    <span className="text-[11px] text-secondary font-medium">
                                        {formatDate(article.publish_date)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
