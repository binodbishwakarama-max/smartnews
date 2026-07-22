'use client';
import type { Article } from '../../app/page';
import Header from '../Header';
import ArticleFeed from '../ArticleFeed';
import ForYouFeed from '../ForYouFeed';
import TrendingSidebar from '../TrendingSidebar';
import { NewsCard } from '../EditorialComponents';
import Link from 'next/link';
import { Activity } from 'lucide-react';

interface DesktopLayoutProps {
    articles: Article[];
    trending: { topic: string; article_count: number }[];
    category?: string;
}

export default function DesktopLayout({ articles, trending, category }: DesktopLayoutProps) {
    return (
        <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white">
            <Header />

            {/* Prestige Master Layout Container (BBC / Widescreen Standard max-w-screen-2xl) */}
            <main className="max-w-screen-2xl mx-auto px-6 lg:px-10 py-10">
                {category && category !== 'For You' && (
                    <div className="mb-10 border-b-4 border-primary pb-4 flex justify-between items-end">
                        <h2 className="text-5xl font-serif font-black tracking-tighter uppercase text-primary">{category}</h2>
                        <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-secondary">Verified Stories</span>
                    </div>
                )}

                {/* Balanced 2-Column Editorial Layout */}
                <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
                    
                    {/* LEFT / MAIN COLUMN: Primary Story Stream (Flex-1 / 72% Width) */}
                    <div className="flex-1 min-w-0 border-r border-border/80 lg:pr-10 space-y-8">
                        {category === 'For You' ? (
                            <ForYouFeed />
                        ) : (
                            <ArticleFeed
                                initialArticles={articles}
                                category={category}
                                showHero={!category}
                            />
                        )}
                    </div>

                    {/* RIGHT COLUMN: Trending Topics & Leaderboard Shorts (360px Sticky Sidebar) */}
                    <aside className="lg:w-96 shrink-0 space-y-10 sticky top-32">
                        {/* 1. Real-Time Trending Topics Cloud */}
                        <TrendingSidebar topics={trending} />

                        {/* 2. Editor's Choice Leaderboard */}
                        <section className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                            <h3 className="text-xs font-mono font-black uppercase tracking-[0.25em] mb-4 text-secondary border-b border-border pb-3 flex items-center justify-between">
                                <span>Editor's Picks</span>
                                <Activity className="w-4 h-4 text-accent" />
                            </h3>
                            <div className="flex flex-col divide-y divide-border">
                                {articles.slice(10, 15).map((art, idx) => (
                                    <div key={art.id || idx} className="py-3 group">
                                        <NewsCard article={art} horizontal />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>

                </div>
            </main>

            {/* Prestige Editorial Footer */}
            <footer className="mt-32 border-t-2 border-primary bg-card py-16">
                <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="col-span-1 lg:col-span-2">
                        <h2 className="text-4xl font-serif font-black tracking-tighter uppercase mb-4">
                            The Smart News<span className="text-accent">.</span>
                        </h2>
                        <p className="text-secondary text-sm leading-relaxed max-w-md">
                            Independent journalism powered by artificial intelligence. Worldwide coverage delivered with editorial precision.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-xs font-mono font-black uppercase tracking-widest mb-6 border-b border-border pb-2">
                            Quick Links
                        </h4>
                        <nav className="flex flex-col gap-3 text-sm font-medium">
                            <Link href="/" className="hover:text-accent transition-colors">Global Feed</Link>
                            <Link href="/saved" className="hover:text-accent transition-colors">Saved Articles</Link>
                            <Link href="/admin" className="hover:text-accent transition-colors">Admin Command</Link>
                        </nav>
                    </div>
                    <div>
                        <h4 className="text-xs font-mono font-black uppercase tracking-widest mb-6 border-b border-border pb-2">
                            Engine
                        </h4>
                        <div className="space-y-2 text-xs font-mono text-secondary">
                            <p>Version: 2.1 Production</p>
                            <p>Ingestion: 800+ Articles</p>
                            <p>Infrastructure: Vercel + Render</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
