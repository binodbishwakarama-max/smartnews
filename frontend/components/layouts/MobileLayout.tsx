'use client';
import { useState } from 'react';
import type { Article } from '../../app/page';
import MobileHeader from '../mobile/MobileHeader';
import MobileCategoryBar from '../mobile/MobileCategoryBar';
import MobileBottomNav from '../mobile/MobileBottomNav';
import MobileArticleCard from '../mobile/MobileArticleCard';
import MobileSearch from '../mobile/MobileSearch';
import Sidebar from '../Sidebar';

interface MobileLayoutProps {
    articles: Article[];
    category?: string;
    onSelectCategory?: (cat: string) => void;
}

export default function MobileLayout({ articles, category, onSelectCategory }: MobileLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isPulseOpen, setIsPulseOpen] = useState(false);

    const leadArticle = articles.length > 0 ? articles[0] : null;
    const remainingArticles = articles.length > 1 ? articles.slice(1) : [];

    return (
        <div 
            className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white select-none max-w-full overflow-x-hidden"
            style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
            {/* 1. Compact 56px Header */}
            <MobileHeader
                onOpenMenu={() => setIsMenuOpen(true)}
                onOpenSearch={() => setIsSearchOpen(true)}
            />

            {/* 2. Horizontal Snap Category Pill Bar */}
            <MobileCategoryBar onSelectCategory={onSelectCategory} />

            {/* 3. Main Article Stream Container */}
            <main className="px-4 py-4 max-w-md mx-auto space-y-3">
                {category && category !== 'For You' && (
                    <div className="mb-3 border-b-2 border-brand pb-2 flex justify-between items-end">
                        <h2 className="text-xl font-serif font-black tracking-tighter uppercase text-primary">
                            {category}
                        </h2>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-secondary">
                            {articles.length} Stories
                        </span>
                    </div>
                )}

                {/* Lead Story Above the Fold */}
                {leadArticle && (
                    <MobileArticleCard article={leadArticle} isLead={true} />
                )}

                {/* Remaining Articles List */}
                <div className="space-y-3">
                    {remainingArticles.map((art) => (
                        <MobileArticleCard key={art.id || art.url} article={art} isLead={false} />
                    ))}
                </div>

                {articles.length === 0 && (
                    <div className="text-center py-16 space-y-2 border-2 border-dashed border-border/80 rounded-2xl">
                        <p className="text-sm font-serif font-bold text-primary">No stories currently in this category</p>
                        <p className="text-xs text-secondary">Check back soon as our rolling ingestion scraper updates live.</p>
                    </div>
                )}
            </main>

            {/* 4. Native Bottom Navigation Bar */}
            <MobileBottomNav
                onOpenMenu={() => setIsMenuOpen(true)}
                onOpenSearch={() => setIsSearchOpen(true)}
                onOpenPulse={() => setIsMenuOpen(true)}
            />

            {/* 5. Mobile Search Overlay */}
            <MobileSearch
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />

            {/* 6. Mobile Navigation Drawer */}
            <Sidebar
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
        </div>
    );
}
