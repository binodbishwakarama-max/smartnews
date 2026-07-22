'use client';
import type { Article } from '../../app/page';
import Header from '../Header';
import ArticleFeed from '../ArticleFeed';
import ForYouFeed from '../ForYouFeed';
import TrendingSidebar from '../TrendingSidebar';
import { NewsCard } from '../EditorialComponents';
import Link from 'next/link';
import { Sparkles, Bookmark, Zap, Activity, Globe, Compass, ShieldCheck } from 'lucide-react';

interface DesktopLayoutProps {
    articles: Article[];
    trending: { topic: string; article_count: number }[];
    category?: string;
}

const TOPIC_TAGS = ['AI & Tech', 'Climate', 'Markets', 'Elections', 'Geopolitics', 'Science', 'Healthcare'];

export default function DesktopLayout({ articles, trending, category }: DesktopLayoutProps) {
    return (
        <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white">
            <Header />

            {/* Ultra-Wide Master Layout Container (Up to 1536px) */}
            <main className="max-w-[1536px] mx-auto px-8 py-8">
                {category && category !== 'For You' && (
                    <div className="mb-10 border-b-4 border-primary pb-4 flex justify-between items-end">
                        <h2 className="text-5xl font-serif font-black tracking-tighter uppercase">{category}</h2>
                        <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-secondary">Verified Stories</span>
                    </div>
                )}

                {/* 3-Column Widescreen Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT COLUMN: Newsroom Intelligence Hub (25% on 12-col = ~3 col) */}
                    <aside className="hidden xl:block lg:col-span-3 space-y-8 sticky top-32">
                        {/* Topic Heatmap Badges */}
                        <div className="p-5 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
                            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                                <Sparkles className="w-4 h-4 text-accent" /> Topic Radar
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {TOPIC_TAGS.map((tag) => (
                                    <Link
                                        key={tag}
                                        href={`/?category=${encodeURIComponent(tag.split(' ')[0])}`}
                                        className="px-3 py-1.5 rounded-full bg-muted text-[11px] font-mono font-bold text-secondary hover:text-accent hover:bg-accent/10 transition-all border border-border/50"
                                    >
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Fast Navigation Shortcuts */}
                        <div className="p-5 rounded-2xl bg-card border border-border space-y-3 shadow-sm">
                            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-primary flex items-center gap-2 border-b border-border pb-3">
                                <Compass className="w-4 h-4 text-accent" /> Desk Shortcuts
                            </h3>
                            <nav className="space-y-1 font-serif text-sm">
                                <Link href="/" className="flex items-center justify-between p-2 rounded-xl hover:bg-muted font-bold transition-colors">
                                    <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-accent" /> Global Wire</span>
                                    <span className="text-[10px] font-mono text-secondary">LIVE</span>
                                </Link>
                                <Link href="/saved" className="flex items-center justify-between p-2 rounded-xl hover:bg-muted font-bold transition-colors">
                                    <span className="flex items-center gap-2"><Bookmark className="w-4 h-4 text-gold" /> Saved Library</span>
                                    <span className="text-[10px] font-mono text-secondary">READ LATER</span>
                                </Link>
                                <Link href="/admin" className="flex items-center justify-between p-2 rounded-xl hover:bg-muted font-bold transition-colors">
                                    <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> Admin Command</span>
                                    <span className="text-[10px] font-mono text-secondary">v2.1</span>
                                </Link>
                            </nav>
                        </div>

                        {/* System Engine Health Card */}
                        <div className="p-5 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 space-y-3 shadow-lg">
                            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-green-400">
                                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Engine Status</span>
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                            </div>
                            <p className="text-xs text-slate-300 font-serif leading-relaxed">
                                Real-time ingestion active. 800+ news feeds indexed across 12 categories.
                            </p>
                        </div>
                    </aside>

                    {/* CENTER COLUMN: Main Editorial Stream (6 col on xl, 8 on lg) */}
                    <div className="lg:col-span-8 xl:col-span-6 space-y-8">
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

                    {/* RIGHT COLUMN: Trending Topics & Leaderboard Shorts (3 col on xl, 4 on lg) */}
                    <aside className="lg:col-span-4 xl:col-span-3 space-y-8 sticky top-32">
                        <TrendingSidebar topics={trending} />

                        {/* Editor's Choice Shorts */}
                        <section className="p-5 rounded-2xl bg-card border border-border shadow-sm">
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

            {/* Master Edition Footer */}
            <footer className="mt-32 border-t-2 border-primary bg-card py-16">
                <div className="max-w-[1536px] mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="col-span-1 lg:col-span-2">
                        <h2 className="text-4xl font-serif font-black tracking-tighter uppercase mb-4">
                            The Smart News<span className="text-accent">.</span>
                        </h2>
                        <p className="text-secondary text-sm leading-relaxed max-w-md">
                            Independent journalism and automated intelligence. Worldwide coverage delivered with editorial precision.
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
