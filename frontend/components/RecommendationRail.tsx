'use client';
import { useEffect, useState, useRef } from 'react';
import { Article } from '../app/page';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { formatDate } from '../lib/dateUtils';
import BookmarkButton from './BookmarkButton';
import { API_ENDPOINTS } from '../lib/config';
import { safeApiRequest } from '../lib/api';

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
                const url = `${API_ENDPOINTS.ARTICLES}?limit=30`;
                const data = await safeApiRequest<{ articles?: Article[] }>(url, { skipRetry: true });
                const allArticles: Article[] = data?.articles ?? [];

                const filtered = allArticles
                    .filter(a => !excludeIds.includes(a.id))
                    .filter(a => a.image_url) // Must have image for the rail
                    .slice(0, 10); // Top 10

                setArticles(filtered);
            } catch {
                setArticles([]);
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
        <section className="py-12 border-t-4 border-b-4 border-double border-brand dark:border-border bg-paper dark:bg-muted/10 my-16 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <span className="flex items-center gap-1.5 text-xs font-mono font-black uppercase tracking-[0.25em] text-accent mb-2">
                            <Award className="w-4 h-4 text-accent" />
                            RECOMMENDED DISPATCHES
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif font-black uppercase">
                            Trending Coverage
                        </h2>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-2 hidden md:flex">
                        <button
                            onClick={() => scroll('left')}
                            className="p-3 border-2 border-brand dark:border-border hover:bg-brand hover:text-background dark:hover:bg-primary dark:hover:text-background transition-colors rounded-none cursor-pointer"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="p-3 border-2 border-brand dark:border-border hover:bg-brand hover:text-background dark:hover:bg-primary dark:hover:text-background transition-colors rounded-none cursor-pointer"
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
                            <div key={i} className="min-w-[280px] md:min-w-[320px] h-[400px] bg-muted animate-pulse rounded-none" />
                        ))
                    ) : (
                        articles.map(article => (
                            <div
                                key={article.id}
                                className="min-w-[280px] md:min-w-[320px] snap-start group relative flex flex-col p-4 bg-card border-2 border-brand dark:border-border shadow-[4px_4px_0px_0px_var(--color-brand)] dark:shadow-[4px_4px_0px_0px_var(--color-border)] hover:shadow-[6px_6px_0px_0px_var(--color-brand)] dark:hover:shadow-[6px_6px_0px_0px_var(--color-border)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all duration-300"
                            >
                                <div className="aspect-[3/4] overflow-hidden bg-muted mb-4 relative border border-brand/10 rounded-none">
                                    <img
                                        src={article.image_url}
                                        alt={article.title || 'Recommended story image'}
                                        className="w-full h-full object-cover transition-transform duration-700"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <BookmarkButton article={article} className="bg-white dark:bg-black border border-brand rounded-none p-1.5 shadow-md" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 py-2.5 bg-black/75 text-white font-mono font-bold text-[9px] uppercase tracking-widest text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        OPEN DISPATCH
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-accent">
                                        {article.category}
                                    </span>
                                    <h3 className="text-lg font-serif font-black leading-tight group-hover:text-accent line-clamp-2">
                                        <Link href={article.url} target="_blank">{article.title}</Link>
                                    </h3>
                                    <span className="text-[10px] font-mono font-bold text-secondary">
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
