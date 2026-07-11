'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Article } from '../app/page';
import { formatDate, formatTime } from '../lib/dateUtils';
import BookmarkButton from './BookmarkButton';
import { ShieldCheck, Layers, Award, Share2, Flame, Clock } from 'lucide-react';
import { useReader } from '../contexts/ReaderContext';
import { useReadingHistory } from '../contexts/ReadingHistoryContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isJustIn(publishDate: string): boolean {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    return new Date(publishDate).getTime() > twoHoursAgo;
}

function estimateReadTime(content: string): number {
    // Average adult reads ~238 words/min
    const words = content?.split(/\s+/).length || 0;
    return Math.max(1, Math.round(words / 238));
}

function fakeReaderCount(id: number, viewCount?: number): number {
    // Produce a believable seeded number based on article id
    // Grows with recency-weighted seed so newer articles show low counts
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
            // Brief toast (no library)
            const toast = document.createElement('div');
            toast.textContent = '🔗 Link copied!';
            toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#111;color:#fff;padding:10px 18px;font-size:12px;font-weight:700;letter-spacing:0.1em;z-index:9999;border-radius:2px;animation:fadeIn 0.2s ease';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
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
                className={`group flex gap-4 items-start py-4 border-b border-border/80 hover:bg-card/40 p-3 rounded-none transition-all duration-300 relative cursor-pointer
                    ${isSelected ? 'keyboard-focused-card bg-accent/2' : ''}`}
            >
                <div className="news-image-wrap w-20 h-20 flex-shrink-0 bg-muted rounded-none border border-brand/20 overflow-hidden relative">
                    <img src={article.image_url || '/placeholder.jpg'} alt={article.title || 'News image'} loading="lazy" className="w-full h-full object-cover grayscale contrast-110 hover:grayscale-0 transition-all duration-700" />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-accent">{article.category}</span>
                            <span className="flex items-center gap-0.5 text-[9px] font-mono font-black border border-accent/30 text-accent px-1.5 py-0.5 rounded-none bg-accent/5">
                                <ShieldCheck className="w-2.5 h-2.5 text-accent" />
                                {curationScore} INDEX
                            </span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <BookmarkButton article={article} />
                        </div>
                    </div>
                    <h3 className="text-sm md:text-base font-serif font-black leading-tight group-hover:text-accent transition-colors line-clamp-2 pr-4 cursor-pointer" onClick={() => handleOpen()}>
                        {article.title}
                    </h3>
                    <span className="text-[9px] text-secondary font-mono font-bold uppercase tracking-wide">{article.source} • {formatDate(article.publish_date)}</span>
                    {article.other_sources && article.other_sources.length > 0 && (
                        <OtherCoverage sources={article.other_sources} />
                    )}
                </div>
            </article>
        );
    }

    return (
        <article
            ref={indexRef as any}
            onClick={handleOpen}
            className={`group flex flex-col gap-4 p-5 bg-card border-2 border-brand dark:border-border rounded-none shadow-[4px_4px_0px_0px_var(--color-brand)] dark:shadow-[4px_4px_0px_0px_var(--color-border)] hover:shadow-[8px_8px_0px_0px_var(--color-brand)] dark:hover:shadow-[8px_8px_0px_0px_var(--color-border)] hover:-translate-y-1 hover:-translate-x-0.5 transition-all duration-300 cursor-pointer ${!dense ? 'pb-6' : ''}
                ${isSelected ? 'keyboard-focused-card bg-accent/2' : ''}`}
        >
            <div className="news-image-wrap aspect-[16/9] bg-muted relative rounded-none border border-brand/20 overflow-hidden">
                <img src={article.image_url || '/placeholder.jpg'} alt={article.title || 'News image'} loading="lazy" className="w-full h-full object-cover transition-transform duration-700" />

                {/* Badges row */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 bg-black text-white text-[9px] font-mono font-black px-2.5 py-1 rounded-none border border-white/20 shadow-lg">
                        <Award className="w-3 h-3 text-gold" />
                        <span className="tracking-widest">VERITY INDEX // {curationScore}</span>
                    </div>
                    {justIn && (
                        <div className="flex items-center gap-1 bg-accent text-white text-[9px] font-mono font-black px-2 py-1 rounded-none shadow-lg animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            JUST IN
                        </div>
                    )}
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                    <BookmarkButton article={article} className="bg-white dark:bg-black border border-brand rounded-none p-1 shadow-md" />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-accent">{article.category || 'News'}</span>
                <h3 className={`${dense ? 'text-lg' : 'text-xl md:text-2xl'} font-serif font-black leading-snug group-hover:text-accent transition-colors cursor-pointer`} onClick={() => handleOpen()}>
                    {article.title}
                </h3>
                {!dense && (
                    <p className="text-secondary text-sm leading-relaxed line-clamp-3 font-sans font-medium border-l-2 border-brand/20 pl-3">
                        {article.summary || article.title}
                    </p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-black uppercase tracking-wider">{article.source}</span>
                        <span className="w-1.5 h-1.5 bg-accent rounded-none" />
                        <span className="text-[11px] text-secondary font-mono font-bold">{formatTime(article.publish_date)}</span>
                        <span className="w-1.5 h-1.5 bg-border rounded-none hidden sm:block" />
                        <span className="hidden sm:flex items-center gap-1 text-[10px] text-secondary font-mono">
                            <Clock className="w-2.5 h-2.5" />{readTime}m
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Reader count */}
                        <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold text-secondary">
                            <Flame className={`w-3 h-3 text-orange-500 ${pulse ? 'animate-counter-pulse' : ''}`} />
                            <span className={pulse ? 'text-accent font-black transition-colors duration-200' : ''}>
                                {views.toLocaleString()}
                            </span>
                        </span>
                        {/* Share */}
                        <button
                            onClick={(e) => { e.stopPropagation(); shareArticle(article); }}
                            className="p-1 hover:text-accent transition-colors rounded cursor-pointer"
                            title="Share article"
                            aria-label="Share"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="md:hidden">
                            <BookmarkButton article={article} />
                        </div>
                    </div>
                </div>
                {article.other_sources && article.other_sources.length > 0 && (
                    <OtherCoverage sources={article.other_sources} />
                )}
            </div>
        </article>
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
    const justIn = isJustIn(article.publish_date);
    const readTime = estimateReadTime(article.content || '');

    const handleOpen = (e?: React.MouseEvent) => {
        e?.preventDefault();
        recordRead(article.id, article.category);
        openReader(article.id);
    };

    return (
        <section 
            ref={indexRef as any}
            className={`group py-8 border-b-4 border-double border-brand mb-12 transition-all duration-200
                ${isSelected ? 'keyboard-focused-card keyboard-focused-lead bg-accent/2' : ''}`}
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div 
                    onClick={() => handleOpen()}
                    className="lg:col-span-8 news-image-wrap aspect-[16/9] relative border-2 border-brand dark:border-border rounded-none shadow-[6px_6px_0px_0px_var(--color-brand)] dark:shadow-[6px_6px_0px_0px_var(--color-border)] hover:shadow-[10px_10px_0px_0px_var(--color-brand)] dark:hover:shadow-[10px_10px_0px_0px_var(--color-border)] transition-all duration-300 cursor-pointer"
                >
                    <img src={article.image_url || ''} alt={article.title || 'Lead story image'} loading="eager" className="w-full h-full object-cover transition-transform duration-1000" />
                    
                    {/* Curation Badge */}
                    <div className="absolute top-4 left-4 z-10">
                        <div className="flex items-center gap-1.5 bg-black text-white text-xs font-mono font-black px-3.5 py-1.5 rounded-none border border-white/20 shadow-xl">
                            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                            <span className="tracking-widest">EDITORIAL LEAD // SCORE {curationScore}</span>
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                        <BookmarkButton article={article} className="bg-white dark:bg-black border border-brand p-1.5 rounded-none shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                <div className="lg:col-span-4 flex flex-col justify-center gap-6">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-mono font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-accent rounded-none animate-pulse"></span>
                            Lead Coverage
                        </span>
                        <BookmarkButton article={article} showText />
                    </div>

                    <h2 className="text-3xl lg:text-5xl font-serif font-black leading-tight group-hover:text-accent transition-colors cursor-pointer" onClick={() => handleOpen()}>
                        {article.title}
                    </h2>
                    <p className="text-secondary text-base lg:text-lg leading-relaxed font-sans font-medium cursor-pointer" onClick={() => handleOpen()}>
                        <span className="text-3xl font-serif font-bold text-brand mr-1 leading-none float-left uppercase">T</span>
                        {article.summary || "High-priority analysis on today's defining global event. Our editorial team has flagged this development for immediate attention."}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-mono font-black uppercase tracking-widest pt-4 border-t border-border">
                        <div className="px-2.5 py-1 bg-brand text-background dark:text-black font-black rounded-none">{article.source}</div>
                        <span>{formatDate(article.publish_date)}</span>
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
    const { openReader } = useReader();
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
        <div className="mt-3.5 pt-3 border-t border-border/40 flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold text-secondary" onClick={(e) => e.stopPropagation()}>
            <span className="flex items-center gap-1 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-accent" />
                Cross-Coverage:
            </span>
            <div className="flex flex-wrap gap-1.5">
                {uniqueSources.map((s) => (
                    <button
                        key={s.id}
                        onClick={(e) => { e.preventDefault(); openReader(s.id); }}
                        className="px-2 py-0.5 rounded-none bg-muted hover:bg-accent/15 hover:text-accent transition-colors cursor-pointer border border-border/60"
                        title={s.title}
                    >
                        {s.source}
                    </button>
                ))}
            </div>
        </div>
    );
}
