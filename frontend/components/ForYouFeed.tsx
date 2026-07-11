'use client';
import { useEffect, useState } from 'react';
import { useReadingHistory } from '../contexts/ReadingHistoryContext';
import { NewsCard, LeadStory } from './EditorialComponents';
import type { Article } from '../app/page';
import { API_ENDPOINTS } from '../lib/config';
import { safeApiRequest } from '../lib/api';
import { Sparkles, BookOpen } from 'lucide-react';

const FALLBACK_CATEGORIES = ['Technology', 'Science', 'World', 'Business'];

export default function ForYouFeed() {
    const { topCategories, totalRead, affinity } = useReadingHistory();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    const cats = topCategories.length > 0 ? topCategories : FALLBACK_CATEGORIES;

    useEffect(() => {
        async function fetchPersonalised() {
            setLoading(true);
            try {
                // Fetch from top 2 categories in parallel
                const requests = cats.slice(0, 2).map(cat =>
                    safeApiRequest<{ articles?: Article[] }>(
                        `${API_ENDPOINTS.ARTICLES}?limit=12&category=${encodeURIComponent(cat)}`,
                        { skipRetry: true }
                    )
                );
                const results = await Promise.all(requests);
                const merged: Article[] = [];
                const seen = new Set<number>();

                // Interleave results: take turns from each category
                const lists = results.map(r => r?.articles || []);
                const maxLen = Math.max(...lists.map(l => l.length));
                for (let i = 0; i < maxLen; i++) {
                    for (const list of lists) {
                        const item = list[i];
                        if (item && !seen.has(item.id)) {
                            seen.add(item.id);
                            merged.push(item);
                        }
                    }
                }
                setArticles(merged);
            } catch {
                setArticles([]);
            } finally {
                setLoading(false);
            }
        }
        fetchPersonalised();
    }, [cats.join(',')]);

    return (
        <div>
            {/* Header */}
            <div className="mb-10 pb-4 border-b-4 border-double border-brand">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-accent">
                        Personalised Feed
                    </span>
                </div>
                <h2 className="text-5xl font-serif font-black tracking-tighter uppercase">For You</h2>
                {totalRead > 0 ? (
                    <p className="text-sm text-secondary mt-2 font-medium">
                        Curated based on your {totalRead} article{totalRead !== 1 ? 's' : ''} read
                        {topCategories.length > 0 && (
                            <> · Top interests: <span className="text-primary font-black">{topCategories.slice(0, 3).join(', ')}</span></>
                        )}
                    </p>
                ) : (
                    <div className="flex items-center gap-2 mt-3 text-sm text-secondary">
                        <BookOpen className="w-4 h-4" />
                        <span>Read a few articles and we'll personalise this feed for you.</span>
                    </div>
                )}

                {/* Affinity bars */}
                {Object.keys(affinity).length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(affinity)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([cat, count]) => {
                                const maxCount = Math.max(...Object.values(affinity));
                                return (
                                    <div key={cat} className="flex items-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-wider">
                                        <div className="flex items-center gap-1 px-2 py-1 bg-muted border border-border">
                                            <span>{cat}</span>
                                            <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent rounded-full"
                                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-accent">{count}</span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Feed */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-muted animate-pulse h-64 border border-border" />
                    ))}
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-20 text-secondary">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-serif text-xl font-black">Nothing yet</p>
                    <p className="text-sm mt-2">Browse the feed and we'll learn your preferences.</p>
                </div>
            ) : (
                <>
                    <div className="mb-12">
                        <LeadStory article={articles[0]} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                        {articles.slice(1).map((art, idx) => (
                            <NewsCard key={`${art.id}-${idx}`} article={art} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
