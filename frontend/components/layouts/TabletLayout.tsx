'use client';
import { useState } from 'react';
import type { Article } from '../../app/page';
import TabletHeader from '../tablet/TabletHeader';
import Sidebar from '../Sidebar';
import { NewsCard } from '../EditorialComponents';

interface TabletLayoutProps {
    articles: Article[];
    category?: string;
}

export default function TabletLayout({ articles, category }: TabletLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const leadArticle = articles.length > 0 ? articles[0] : null;
    const gridArticles = articles.length > 1 ? articles.slice(1) : [];

    return (
        <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white">
            {/* Tablet Header */}
            <TabletHeader onOpenMenu={() => setIsMenuOpen(true)} />

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                {category && (
                    <div className="border-b-2 border-brand pb-3 flex justify-between items-end">
                        <h2 className="text-3xl font-serif font-black tracking-tighter uppercase">{category}</h2>
                        <span className="text-xs font-mono font-bold uppercase text-secondary">{articles.length} Stories</span>
                    </div>
                )}

                {/* Tablet Lead Hero Story */}
                {leadArticle && (
                    <div className="bg-card dark:bg-paper border border-border rounded-2xl p-6 shadow-sm">
                        <NewsCard article={leadArticle} />
                    </div>
                )}

                {/* Tablet Two-Column Article Grid */}
                <div className="grid grid-cols-2 gap-6">
                    {gridArticles.map((art) => (
                        <div key={art.id || art.url} className="bg-card dark:bg-paper border border-border rounded-xl p-4 shadow-sm">
                            <NewsCard article={art} />
                        </div>
                    ))}
                </div>
            </main>

            {/* Sidebar */}
            <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </div>
    );
}
