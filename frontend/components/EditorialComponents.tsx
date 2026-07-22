'use client';
import { useState, useEffect } from 'react';
import { Article } from '../app/page';
import { formatDate, formatTime } from '../lib/dateUtils';
import BookmarkButton from './BookmarkButton';
import { ShieldCheck, Layers, Share2, Flame, Clock } from 'lucide-react';
import { useReader } from '../contexts/ReaderContext';
import { useReadingHistory } from '../contexts/ReadingHistoryContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isJustIn(publishDate: string): boolean {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    return new Date(publishDate).getTime() > twoHoursAgo;
}

function estimateReadTime(content: string): number {
    const words = content?.split(/\s+/).length || 0;
    return Math.max(1, Math.round(words / 238));
}

function fakeReaderCount(id: number, viewCount?: number): number {
    const base = viewCount ?? (((id * 137 + 42) % 800) + 50);
    return Math.max(12, base);
}

async function shareArticle(article: Article) {
    const shareData = { title: article.title, url: article.url, text: article.summary || article.title };
    try {
        if (navigator.share && navigator.canShare?.(shareData)) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(article.url);
            const toast = document.createElement('div');
            toast.textContent = '🔗 Link copied to clipboard!';
            toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e293b;color:#fff;padding:12px 20px;font-size:13px;font-weight:700;z-index:9999;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2)';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2200);
        }
    } catch {}
}

function useLiveViews(initialCount: number) {
    const [views, setViews] = useState(initialCount);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const increment = Math.floor(Math.random() * 3) + 1;
            setViews(prev => prev + increment);
            setPulse(true);
            const timeout = setTimeout(() => setPulse(false), 400);
            return () => clearTimeout(timeout);
        }, 6000 + Math.random() * 5000);

        return () => clearInterval(interval);
    }, []);

    return { views, pulse };
}

// ─── BBC News Style Article Card ──────────────────────────────────────────────
export function NewsCard({ 
    article, 
    horizontal = false, 
    dense = false,
    isSelected = false,
    indexRef
}: { 
    article: Article, 
    horizontal?: boolean, 
    dense?: boolean,
    isSelected?: boolean,
    indexRef?: React.RefObject<HTMLDivElement | null>
}) {
    const curationScore = ((article.quality_score || 75.0) / 10).toFixed(1);
    const { openReader } = useReader();
    const { recordRead } = useReadingHistory();
    const justIn = isJustIn(article.publish_date);
    const readTime = estimateReadTime(article.content || '');
    const readerCount = fakeReaderCount(article.id, (article as any).view_count);
    const { views, pulse } = useLiveViews(readerCount);

    const handleOpen = (e?: React.MouseEvent) => {
        e?.preventDefault();
        recordRead(article.id, article.category);
        openReader(article.id);
    };

    if (horizontal) {
        return (
            <article 
                ref={indexRef as any}
                onClick={handleOpen}
                className={`group flex gap-4 items-center py-3.5 border-b border-border/60 hover:bg-muted/40 p-2.5 rounded-xl transition-all duration-200 cursor-pointer
                    ${isSelected ? 'ring-2 ring-accent bg-accent/5' : ''}`}
            >
                <div className="w-20 h-20 shrink-0 bg-muted rounded-xl border border-border/40 overflow-hidden relative">
                    <img 
                        src={article.image_url || '/placeholder.jpg'} 
                        alt={article.title || 'News thumbnail'} 
                        loading="lazy" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                            {article.category || 'News'}
                        </span>
                        <span className="text-[10px] font-mono text-secondary uppercase font-bold truncate">
                            {article.source}
                        </span>
                    </div>
                    <h3 className="text-sm font-serif font-bold leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {article.title}
                    </h3>
                </div>
            </article>
        );
    }

    return (
        <article
            ref={indexRef as any}
            onClick={handleOpen}
            className={`group flex flex-col bg-card border border-border/80 hover:border-accent/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
                isSelected ? 'ring-2 ring-accent bg-accent/5' : ''
            }`}
        >
            {/* Image Container with BBC Zoom Animation */}
            <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                <img 
                    src={article.image_url || '/placeholder.jpg'} 
                    alt={article.title || 'News image'} 
                    loading="lazy" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                />

                {/* Category & Just-In Pills */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                    <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-black px-2.5 py-1 rounded-lg border border-white/20 uppercase tracking-widest shadow-md">
                        {article.category || 'News'}
                    </span>
                    {justIn && (
                        <span className="bg-accent text-white text-[9px] font-mono font-black px-2 py-1 rounded-lg shadow-md animate-pulse">
                            LIVE
                        </span>
                    )}
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                    <BookmarkButton article={article} className="bg-card/90 backdrop-blur-md border border-border rounded-xl p-1.5 shadow-md" />
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div className="space-y-2">
                    <h3 className={`${dense ? 'text-lg' : 'text-xl'} font-serif font-black leading-snug group-hover:text-accent transition-colors`}>
                        {article.title}
                    </h3>
                    {!dense && article.summary && (
                        <p className="text-secondary text-xs lg:text-sm leading-relaxed line-clamp-2 font-sans">
                            {article.summary}
                        </p>
                    )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px] font-mono text-secondary">
                    <div className="flex items-center gap-2 truncate">
                        <span className="font-black text-primary uppercase">{article.source}</span>
                        <span>•</span>
                        <span>{formatTime(article.publish_date)}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-secondary" /> {readTime}m
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); shareArticle(article); }}
                            className="p-1 hover:text-accent transition-colors rounded cursor-pointer"
                            title="Share article"
                            aria-label="Share"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

// ─── BBC Style Lead Story Component ───────────────────────────────────────────
// ─── BBC Top Hero Grid Component (Lead Story + 3 Side Cards) ────────────────
export function BBCTopHeroGrid({ 
    leadArticle, 
    sideArticles = [] 
}: { 
    leadArticle: Article; 
    sideArticles?: Article[]; 
}) {
    const { openReader } = useReader();
    const { recordRead } = useReadingHistory();

    const handleOpen = (article: Article) => {
        recordRead(article.id, article.category);
        openReader(article.id);
    };

    if (!leadArticle) return null;

    const readTime = estimateReadTime(leadArticle.content || '');

    return (
        <section className="mb-12 border-b border-border/80 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Main Hero Card (7 Columns) */}
                <div 
                    onClick={() => handleOpen(leadArticle)}
                    className="lg:col-span-7 group bg-card border border-border/80 hover:border-accent/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                    <div>
                        <div className="aspect-[16/9] bg-muted relative rounded-2xl overflow-hidden mb-6">
                            <img 
                                src={leadArticle.image_url || '/placeholder.jpg'} 
                                alt={leadArticle.title} 
                                loading="eager" 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                            />
                            <div className="absolute top-4 left-4 z-10">
                                <span className="bg-accent text-white text-xs font-mono font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-widest">
                                    TOP COVERAGE // {leadArticle.category || 'WORLD'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl lg:text-3xl font-serif font-black leading-tight group-hover:text-accent transition-colors">
                                {leadArticle.title}
                            </h2>
                            <p className="text-secondary text-sm leading-relaxed line-clamp-3 font-sans">
                                {leadArticle.summary || leadArticle.content}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-6 border-t border-border/60 text-xs font-mono text-secondary">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-primary uppercase">{leadArticle.source}</span>
                            <span>•</span>
                            <span>{formatDate(leadArticle.publish_date)}</span>
                        </div>
                        <span className="flex items-center gap-1 font-bold text-accent">
                            <Clock className="w-3.5 h-3.5" /> {readTime} min read
                        </span>
                    </div>
                </div>

                {/* 3 Side Hero Cards (5 Columns) */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                        <span className="text-xs font-mono font-black uppercase tracking-widest text-accent flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            Top Stories
                        </span>
                        <span className="text-[10px] font-mono text-secondary uppercase font-bold">BBC Wire</span>
                    </div>

                    {sideArticles.slice(0, 3).map((art, idx) => (
                        <div 
                            key={art.id || idx}
                            onClick={() => handleOpen(art)}
                            className="group flex gap-4 items-center p-4 rounded-2xl bg-card border border-border/60 hover:border-accent/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                        >
                            <div className="w-24 h-24 shrink-0 rounded-xl bg-muted overflow-hidden relative">
                                <img 
                                    src={art.image_url || '/placeholder.jpg'} 
                                    alt={art.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                <span className="text-[10px] font-mono font-black uppercase text-accent">
                                    {art.category || 'News'}
                                </span>
                                <h3 className="text-sm font-serif font-bold leading-snug group-hover:text-accent transition-colors line-clamp-2">
                                    {art.title}
                                </h3>
                                <span className="text-[10px] font-mono text-secondary uppercase font-bold">
                                    {art.source} • {formatTime(art.publish_date)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function LeadStory({ 
    article,
    isSelected = false,
    indexRef
}: { 
    article: Article,
    isSelected?: boolean,
    indexRef?: React.RefObject<HTMLDivElement | null>
}) {
    const curationScore = ((article.quality_score || 85.0) / 10).toFixed(1);
    const { openReader } = useReader();
    const { recordRead } = useReadingHistory();
    const readTime = estimateReadTime(article.content || '');

    const handleOpen = (e?: React.MouseEvent) => {
        e?.preventDefault();
        recordRead(article.id, article.category);
        openReader(article.id);
    };

    return (
        <section 
            ref={indexRef as any}
            onClick={handleOpen}
            className={`group bg-card border border-border/80 hover:border-accent/80 rounded-3xl p-6 lg:p-8 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer mb-10
                ${isSelected ? 'ring-2 ring-accent bg-accent/5' : ''}`}
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* 16:9 Main Image with Hover Zoom */}
                <div className="lg:col-span-7 aspect-[16/9] bg-muted relative rounded-2xl overflow-hidden shadow-md">
                    <img 
                        src={article.image_url || '/placeholder.jpg'} 
                        alt={article.title || 'Lead story image'} 
                        loading="eager" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                    
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                        <span className="bg-accent text-white text-xs font-mono font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-widest">
                            TOP COVERAGE // {article.category || 'WORLD'}
                        </span>
                    </div>

                    <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                        <BookmarkButton article={article} className="bg-card/90 backdrop-blur-md border border-border p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Article Headline & Summary */}
                <div className="lg:col-span-5 flex flex-col justify-center gap-4">
                    <div className="flex items-center gap-3 text-xs font-mono font-black uppercase text-accent">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                        <span>Breaking Lead</span>
                    </div>

                    <h2 className="text-2xl lg:text-4xl font-serif font-black leading-tight group-hover:text-accent transition-colors">
                        {article.title}
                    </h2>

                    <p className="text-secondary text-sm lg:text-base leading-relaxed font-sans line-clamp-4">
                        {article.summary || article.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs font-mono text-secondary">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-primary uppercase">{article.source}</span>
                            <span>•</span>
                            <span>{formatDate(article.publish_date)}</span>
                        </div>

                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-accent" /> {readTime} min read
                        </span>
                    </div>

                    {article.other_sources && article.other_sources.length > 0 && (
                        <OtherCoverage sources={article.other_sources} />
                    )}
                </div>
            </div>
        </section>
    );
}

export function OtherCoverage({ sources }: { sources: { id: number; source: string; title: string }[] }) {
    if (!sources || sources.length === 0) return null;

    const seen = new Set<string>();
    const uniqueSources = sources.filter(s => {
        const name = (s.source || '').trim().toLowerCase();
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
    });

    if (uniqueSources.length === 0) return null;

    return (
        <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold text-secondary" onClick={(e) => e.stopPropagation()}>
            <span className="flex items-center gap-1 uppercase tracking-wider text-accent">
                <Layers className="w-3.5 h-3.5" />
                Cross-Coverage:
            </span>
            {uniqueSources.slice(0, 3).map(s => (
                <span key={s.id} className="px-2 py-0.5 bg-muted rounded-md border border-border/50 uppercase">
                    {s.source}
                </span>
            ))}
        </div>
    );
}
