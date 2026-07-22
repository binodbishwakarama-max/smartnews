'use client';
import type { Article } from '../../app/page';
import Header from '../Header';
import ArticleFeed from '../ArticleFeed';
import ForYouFeed from '../ForYouFeed';
import TrendingSidebar from '../TrendingSidebar';
import { NYTHeadlineItem, NYTCenterStory } from '../EditorialComponents';
import Link from 'next/link';

interface DesktopLayoutProps {
    articles: Article[];
    trending: { topic: string; article_count: number }[];
    category?: string;
}

export default function DesktopLayout({ articles, trending, category }: DesktopLayoutProps) {
    // Slice articles into columns for the NYT tri-column layout
    const leftColumnArticles = articles.slice(0, 5);
    const centerLead = articles[5] || articles[0];
    const centerSecondary = articles.slice(6, 9);
    const rightColumnArticles = articles.slice(9, 14);

    return (
        <div className="min-h-screen bg-white dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 selection:bg-red-700 selection:text-white">
            <Header />

            <main className="max-w-[1200px] mx-auto px-5">
                {/* Category Section Header */}
                {category && category !== 'For You' && (
                    <div className="pt-6 pb-4 border-b-2 border-neutral-900 dark:border-neutral-200 mb-0">
                        <h2 className="text-3xl font-serif font-black tracking-tight text-neutral-900 dark:text-neutral-100">{category}</h2>
                    </div>
                )}

                {/* NYTimes Tri-Column Layout (Homepage only, no category filter) */}
                {!category ? (
                    <div className="grid grid-cols-12 gap-0 pt-6">
                        
                        {/* LEFT COLUMN — Compact headline list (3 cols) */}
                        <div className="col-span-3 border-r border-neutral-200 dark:border-neutral-800 pr-5">
                            <div className="mb-3 pb-2 border-b border-neutral-300 dark:border-neutral-700">
                                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Top Stories</span>
                            </div>
                            {leftColumnArticles.map((art) => (
                                <NYTHeadlineItem key={art.id} article={art} />
                            ))}
                        </div>

                        {/* CENTER COLUMN — Lead + secondary stories (6 cols) */}
                        <div className="col-span-6 px-6">
                            {centerLead && (
                                <NYTCenterStory article={centerLead} isLead />
                            )}
                            {centerSecondary.map((art) => (
                                <NYTCenterStory key={art.id} article={art} />
                            ))}
                        </div>

                        {/* RIGHT COLUMN — Trending + Opinion (3 cols) */}
                        <div className="col-span-3 border-l border-neutral-200 dark:border-neutral-800 pl-5">
                            {/* Trending Topics */}
                            <div className="mb-3 pb-2 border-b border-neutral-300 dark:border-neutral-700">
                                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Trending</span>
                            </div>
                            <TrendingSidebar topics={trending} />

                            {/* Opinion / Editor Picks */}
                            <div className="mt-8 mb-3 pb-2 border-b border-neutral-300 dark:border-neutral-700">
                                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">More Headlines</span>
                            </div>
                            {rightColumnArticles.map((art) => (
                                <NYTHeadlineItem key={art.id} article={art} />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Category / For You view — uses existing ArticleFeed */
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

                {/* Below-the-fold: Remaining articles in grid (homepage only) */}
                {!category && articles.length > 14 && (
                    <div className="mt-10 pt-8 border-t-2 border-neutral-900 dark:border-neutral-200">
                        <div className="mb-6">
                            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">More News</span>
                        </div>
                        <ArticleFeed
                            initialArticles={articles.slice(14)}
                            showHero={false}
                        />
                    </div>
                )}
            </main>

            {/* NYTimes-Style Footer */}
            <footer className="mt-20 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212]">
                <div className="max-w-[1200px] mx-auto px-5 py-10">
                    {/* Nameplate */}
                    <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6 mb-8">
                        <Link href="/">
                            <h2 className="text-2xl font-serif font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                                The Smart News
                            </h2>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-[13px] font-sans">
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-4">News</h4>
                            <nav className="flex flex-col gap-2 text-neutral-600 dark:text-neutral-400">
                                <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">Home</Link>
                                <Link href="/?category=World" className="hover:text-black dark:hover:text-white transition-colors">World</Link>
                                <Link href="/?category=Politics" className="hover:text-black dark:hover:text-white transition-colors">Politics</Link>
                                <Link href="/?category=Business" className="hover:text-black dark:hover:text-white transition-colors">Business</Link>
                            </nav>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-4">Discover</h4>
                            <nav className="flex flex-col gap-2 text-neutral-600 dark:text-neutral-400">
                                <Link href="/?category=Technology" className="hover:text-black dark:hover:text-white transition-colors">Technology</Link>
                                <Link href="/?category=Science" className="hover:text-black dark:hover:text-white transition-colors">Science</Link>
                                <Link href="/?category=Health" className="hover:text-black dark:hover:text-white transition-colors">Health</Link>
                                <Link href="/?category=Culture" className="hover:text-black dark:hover:text-white transition-colors">Culture</Link>
                            </nav>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-4">Account</h4>
                            <nav className="flex flex-col gap-2 text-neutral-600 dark:text-neutral-400">
                                <Link href="/saved" className="hover:text-black dark:hover:text-white transition-colors">Saved Articles</Link>
                                <Link href="/admin" className="hover:text-black dark:hover:text-white transition-colors">Admin</Link>
                            </nav>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 mb-4">About</h4>
                            <div className="text-neutral-500 dark:text-neutral-500 space-y-1.5 text-[12px]">
                                <p>Independent AI-powered journalism.</p>
                                <p>v2.2 · Vercel + Render</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-400 dark:text-neutral-600 text-center">
                        © {new Date().getFullYear()} The Smart News. All Rights Reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
