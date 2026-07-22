'use client';
import { useEffect, useState } from 'react';
import type { Article } from '../../app/page';
import Header from '../Header';
import ArticleFeed from '../ArticleFeed';
import ForYouFeed from '../ForYouFeed';
import TrendingSidebar from '../TrendingSidebar';
import { NYTHeadlineItem, NYTCenterStory, NewsCard } from '../EditorialComponents';
import Link from 'next/link';
import { useReader } from '../../contexts/ReaderContext';
import { useReadingHistory } from '../../contexts/ReadingHistoryContext';
import { formatTime } from '../../lib/dateUtils';
import { API_ENDPOINTS } from '../../lib/config';

interface DesktopLayoutProps {
    articles: Article[];
    trending: { topic: string; article_count: number }[];
    category?: string;
}

// ─── NYTimes 5-Column Category Section Grid ──────────────────────────────────
function NYTCategorySection({ 
    title, 
    articles 
}: { 
    title: string; 
    articles: Article[] 
}) {
    const { openReader } = useReader();
    const { recordRead } = useReadingHistory();

    if (!articles || articles.length === 0) return null;

    const leadArticle = articles[0];
    const textArticles = articles.slice(1, 4);

    const handleOpen = (art: Article) => {
        recordRead(art.id, art.category);
        openReader(art.id);
    };

    return (
        <div className="min-w-0">
            {/* Section Title */}
            <h3 className="text-[13px] font-sans font-extrabold text-neutral-900 dark:text-neutral-100 mb-3 pb-1 border-b-2 border-neutral-900 dark:border-neutral-300">
                {title}
            </h3>

            {/* Lead story with image */}
            {leadArticle && (
                <div 
                    onClick={() => handleOpen(leadArticle)}
                    className="cursor-pointer group mb-3"
                >
                    {leadArticle.image_url && (
                        <div className="aspect-[3/2] w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden mb-2">
                            <img 
                                src={leadArticle.image_url} 
                                alt={leadArticle.title} 
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                            />
                        </div>
                    )}
                    <h4 className="text-[15px] font-serif font-bold leading-snug text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors">
                        {leadArticle.title}
                    </h4>
                    <span className="text-[10px] font-sans text-neutral-400 dark:text-neutral-500 mt-1 block">
                        {formatTime(leadArticle.publish_date)}
                    </span>
                </div>
            )}

            {/* Text-only headline links */}
            {textArticles.map((art) => (
                <div 
                    key={art.id}
                    onClick={() => handleOpen(art)}
                    className="py-2 border-t border-neutral-200 dark:border-neutral-800 cursor-pointer group"
                >
                    <h4 className="text-[13px] font-serif font-semibold leading-snug text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-400 dark:group-hover:text-neutral-500 transition-colors">
                        {art.title}
                    </h4>
                </div>
            ))}
        </div>
    );
}

// ─── NYTimes Sports/Athletic-Style Split Section ─────────────────────────────
function NYTSplitSection({ 
    title,
    subtitle,
    articles,
    rightArticles
}: { 
    title: string;
    subtitle?: string;
    articles: Article[];
    rightArticles?: Article[];
}) {
    const { openReader } = useReader();
    const { recordRead } = useReadingHistory();

    if (!articles || articles.length === 0) return null;

    const handleOpen = (art: Article) => {
        recordRead(art.id, art.category);
        openReader(art.id);
    };

    return (
        <div className="border-t-2 border-neutral-900 dark:border-neutral-300 pt-4 mt-10">
            <div className="flex items-baseline gap-3 mb-4">
                <h3 className="text-lg font-serif font-black text-neutral-900 dark:text-neutral-100">{title}</h3>
                {subtitle && <span className="text-[11px] font-sans italic text-neutral-500">{subtitle}</span>}
            </div>

            <div className="grid grid-cols-12 gap-0">
                {/* Left — Text headlines with summary */}
                <div className="col-span-5 pr-5">
                    {articles.slice(0, 3).map((art) => (
                        <div 
                            key={art.id}
                            onClick={() => handleOpen(art)}
                            className="py-3 border-b border-neutral-200 dark:border-neutral-800 cursor-pointer group"
                        >
                            <h4 className="text-[15px] font-serif font-bold leading-snug text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors">
                                {art.title}
                            </h4>
                            <p className="text-[12px] font-sans text-neutral-500 dark:text-neutral-500 mt-1 leading-relaxed line-clamp-2">
                                {art.summary || (art.content && art.content.substring(0, 100) + '...')}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Center — Large image */}
                <div className="col-span-4 px-4">
                    {articles[0]?.image_url && (
                        <div 
                            onClick={() => handleOpen(articles[0])}
                            className="cursor-pointer group"
                        >
                            <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                                <img 
                                    src={articles[0].image_url} 
                                    alt={articles[0].title} 
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" 
                                />
                            </div>
                            <span className="text-[9px] font-sans text-neutral-400 mt-1 block italic">
                                {articles[0].source}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right — Compact text links */}
                <div className="col-span-3 border-l border-neutral-200 dark:border-neutral-800 pl-5">
                    {(rightArticles || articles.slice(3, 7)).map((art) => (
                        <div 
                            key={art.id}
                            onClick={() => handleOpen(art)}
                            className="py-2.5 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 cursor-pointer group"
                        >
                            <h4 className="text-[13px] font-serif font-bold leading-snug text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors">
                                {art.title}
                            </h4>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function DesktopLayout({ articles, trending, category }: DesktopLayoutProps) {
    // Category-specific article fetching for the below-fold grid
    const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>({});
    
    const GRID_CATEGORIES = ['World', 'Politics', 'Business', 'Technology', 'Science', 'Health'];

    useEffect(() => {
        if (category) return; // Only fetch for homepage
        
        async function fetchCategoryArticles() {
            const results: Record<string, Article[]> = {};
            await Promise.all(
                GRID_CATEGORIES.map(async (cat) => {
                    try {
                        const url = new URL(API_ENDPOINTS.ARTICLES);
                        url.searchParams.append('category', cat);
                        url.searchParams.append('limit', '4');
                        const res = await fetch(url.toString());
                        if (res.ok) {
                            const data = await res.json();
                            results[cat] = Array.isArray(data) ? data : data.articles || [];
                        }
                    } catch {}
                })
            );
            setCategoryArticles(results);
        }
        fetchCategoryArticles();
    }, [category]);

    // Slice articles into columns for the NYT tri-column hero
    const leftColumnArticles = articles.slice(0, 5);
    const centerLead = articles[5] || articles[0];
    const centerSecondary = articles.slice(6, 9);
    const rightColumnArticles = articles.slice(9, 14);

    // Split section articles
    const splitArticles = articles.slice(14, 22);

    return (
        <div className="min-h-screen bg-white dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 selection:bg-red-700 selection:text-white">
            <Header />

            <main className="max-w-[1200px] mx-auto px-5">
                {/* Category Section Header */}
                {category && category !== 'For You' && (
                    <div className="pt-6 pb-3 border-b-2 border-neutral-900 dark:border-neutral-200 mb-0">
                        <h2 className="text-3xl font-serif font-black tracking-tight text-neutral-900 dark:text-neutral-100">{category}</h2>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* HOMEPAGE: NYTimes Full Editorial Layout                    */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {!category ? (
                    <>
                        {/* ── ABOVE THE FOLD: Tri-Column Hero Grid ──────────── */}
                        <div className="grid grid-cols-12 gap-0 pt-5">
                            
                            {/* LEFT COLUMN — Compact headline list (3 cols) */}
                            <div className="col-span-3 border-r border-neutral-200 dark:border-neutral-800 pr-5">
                                {leftColumnArticles.map((art) => (
                                    <NYTHeadlineItem key={art.id} article={art} />
                                ))}
                            </div>

                            {/* CENTER COLUMN — Lead + secondary stories (6 cols) */}
                            <div className="col-span-6 px-5">
                                {centerLead && (
                                    <NYTCenterStory article={centerLead} isLead />
                                )}
                                {centerSecondary.map((art) => (
                                    <NYTCenterStory key={art.id} article={art} />
                                ))}
                            </div>

                            {/* RIGHT COLUMN — Trending + Headlines (3 cols) */}
                            <div className="col-span-3 border-l border-neutral-200 dark:border-neutral-800 pl-5">
                                <TrendingSidebar topics={trending} />

                                <div className="mt-6 mb-2 pb-1 border-b border-neutral-300 dark:border-neutral-700">
                                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-neutral-400 dark:text-neutral-500">More Headlines</span>
                                </div>
                                {rightColumnArticles.map((art) => (
                                    <NYTHeadlineItem key={art.id} article={art} />
                                ))}
                            </div>
                        </div>

                        {/* ── BELOW THE FOLD: NYTimes 5-Column Category Grid ──── */}
                        {Object.keys(categoryArticles).length > 0 && (
                            <div className="mt-10 pt-6 border-t-2 border-neutral-900 dark:border-neutral-300">
                                <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mb-6">
                                    News
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                    {GRID_CATEGORIES.map((cat) => (
                                        <NYTCategorySection 
                                            key={cat} 
                                            title={cat} 
                                            articles={categoryArticles[cat] || []} 
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── SPLIT SECTION: Feature Stories ──────────────────── */}
                        {splitArticles.length > 3 && (
                            <NYTSplitSection
                                title="In Depth"
                                subtitle="Featured coverage"
                                articles={splitArticles}
                            />
                        )}

                        {/* ── MORE NEWS: Remaining articles ──────────────────── */}
                        {articles.length > 22 && (
                            <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                                <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mb-6">
                                    More News
                                </h3>
                                <ArticleFeed
                                    initialArticles={articles.slice(22)}
                                    showHero={false}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    /* Category / For You view */
                    <div className="pt-6">
                        {category === 'For You' ? (
                            <ForYouFeed />
                        ) : (
                            <ArticleFeed
                                initialArticles={articles}
                                category={category}
                                showHero={false}
                            />
                        )}
                    </div>
                )}
            </main>

            {/* NYTimes-Style Footer */}
            <footer className="mt-20 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212]">
                <div className="max-w-[1200px] mx-auto px-5 py-10">
                    <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5 mb-8">
                        <Link href="/">
                            <h2 className="text-2xl font-serif font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                                The Smart News
                            </h2>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[13px] font-sans">
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-3">News</h4>
                            <nav className="flex flex-col gap-1.5 text-neutral-600 dark:text-neutral-400">
                                <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
                                <Link href="/?category=World" className="hover:text-black dark:hover:text-white transition-colors">World</Link>
                                <Link href="/?category=Politics" className="hover:text-black dark:hover:text-white transition-colors">Politics</Link>
                                <Link href="/?category=Business" className="hover:text-black dark:hover:text-white transition-colors">Business</Link>
                            </nav>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-3">Discover</h4>
                            <nav className="flex flex-col gap-1.5 text-neutral-600 dark:text-neutral-400">
                                <Link href="/?category=Technology" className="hover:text-black dark:hover:text-white transition-colors">Technology</Link>
                                <Link href="/?category=Science" className="hover:text-black dark:hover:text-white transition-colors">Science</Link>
                                <Link href="/?category=Health" className="hover:text-black dark:hover:text-white transition-colors">Health</Link>
                                <Link href="/?category=Culture" className="hover:text-black dark:hover:text-white transition-colors">Culture</Link>
                            </nav>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-3">Account</h4>
                            <nav className="flex flex-col gap-1.5 text-neutral-600 dark:text-neutral-400">
                                <Link href="/saved" className="hover:text-black dark:hover:text-white transition-colors">Saved Articles</Link>
                                <Link href="/admin" className="hover:text-black dark:hover:text-white transition-colors">Admin</Link>
                            </nav>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-3">About</h4>
                            <div className="text-neutral-500 dark:text-neutral-500 space-y-1 text-[12px]">
                                <p>Independent AI-powered journalism.</p>
                                <p>v2.2 · Vercel + Render</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-400 dark:text-neutral-600 text-center">
                        © {new Date().getFullYear()} The Smart News. All Rights Reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
