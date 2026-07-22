'use client';
import { Suspense } from 'react';
import type { Article } from '../../app/page';
import Header from '../Header';
import ArticleFeed from '../ArticleFeed';
import ForYouFeed from '../ForYouFeed';
import TrendingSidebar from '../TrendingSidebar';
import ReaderModal from '../ReaderModal';
import { NewsCard } from '../EditorialComponents';
import Link from 'next/link';
import { useReader } from '../../contexts/ReaderContext';

interface DesktopLayoutProps {
    articles: Article[];
    trending: { topic: string; article_count: number }[];
    category?: string;
}

export default function DesktopLayout({ articles, trending, category }: DesktopLayoutProps) {
    return (
        <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white">
            <Header />

            <main className="max-w-7xl mx-auto px-6 py-10">
                {category && category !== 'For You' && (
                    <div className="mb-12 border-b-4 border-black pb-4 flex justify-between items-end">
                        <h2 className="text-6xl font-serif font-black tracking-tighter uppercase">{category}</h2>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] mb-2">Latest Stories</span>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1 lg:max-w-4xl border-r border-border pr-12">
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

                    <div className="lg:w-80 flex-shrink-0">
                        <div className="sticky top-32 space-y-12">
                            <TrendingSidebar topics={trending} />

                            <section>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 text-secondary border-b border-border pb-2">
                                    Featured Shorts
                                </h3>
                                <div className="flex flex-col divide-y divide-border">
                                    {articles.slice(12, 17).map((art, idx) => (
                                        <NewsCard key={art.id || idx} article={art} horizontal />
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-32 border-t-2 border-brand bg-card py-16">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="col-span-1 lg:col-span-2">
                        <h2 className="text-4xl font-serif font-black tracking-tighter uppercase mb-6">
                            The Smart News<span className="text-accent">.</span>
                        </h2>
                        <p className="text-secondary text-sm leading-relaxed max-w-sm">
                            Next-generation journalism powered by artificial intelligence and editorial integrity.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 border-b border-border pb-2">
                            Connect
                        </h4>
                        <nav className="flex flex-col gap-4 text-sm font-medium">
                            <Link href="#" className="hover:text-accent">Twitter / X</Link>
                            <Link href="#" className="hover:text-accent">LinkedIn</Link>
                        </nav>
                    </div>
                </div>
            </footer>
        </div>
    );
}
