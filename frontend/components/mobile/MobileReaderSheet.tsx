'use client';
import { useState, useEffect } from 'react';
import type { Article } from '../../app/page';
import { X, Bookmark, Share2, Type, ExternalLink, Sparkles, Clock, ChevronDown } from 'lucide-react';
import { useBookmarks } from '../../contexts/BookmarkContext';

import { getArticleById } from '../../lib/api';

interface MobileReaderSheetProps {
    articleId: number;
    onClose: () => void;
}

export default function MobileReaderSheet({ articleId, onClose }: MobileReaderSheetProps) {
    const [article, setArticle] = useState<Article | null>(null);
    const [fontSize, setFontSize] = useState<number>(18); // default 18px
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        getArticleById(articleId)
            .then(data => {
                if (mounted && data) setArticle(data);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        document.body.style.overflow = 'hidden';
        return () => {
            mounted = false;
            document.body.style.overflow = '';
        };
    }, [articleId]);

    if (loading && !article) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm">
                <div className="w-full h-96 bg-card dark:bg-background rounded-t-3xl p-8 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin"></div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">Opening Story...</span>
                </div>
            </div>
        );
    }

    if (!article) return null;

    const saved = isBookmarked(article.id);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.summary,
                url: article.url,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(article.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formattedDate = article.publish_date
        ? new Date(article.publish_date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
          })
        : 'Today';

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm transition-opacity duration-300">
            {/* Backdrop click to dismiss */}
            <div className="flex-1 w-full" onClick={onClose} />

            {/* Bottom Sheet Container */}
            <div className="relative w-full max-h-[90vh] min-h-[60vh] bg-card dark:bg-background rounded-t-3xl border-t-2 border-brand shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Drag Handle Bar */}
                <div className="w-full py-3 flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-border/40 shrink-0">
                    <div className="w-12 h-1.5 bg-border rounded-full" />
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5 pb-24">
                    {/* Source & Date Header */}
                    <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-secondary border-b border-border/40 pb-3">
                        <span className="font-black text-accent">{article.source}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formattedDate}</span>
                    </div>

                    {/* Headline */}
                    <h2 className="text-2xl font-serif font-black text-primary leading-tight">
                        {article.title}
                    </h2>

                    {/* Featured Image */}
                    {article.image_url && (
                        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-muted">
                            <img 
                                src={article.image_url} 
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Article Body Content */}
                    <div 
                        className="font-serif leading-relaxed text-primary space-y-4"
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.65 }}
                    >
                        {article.content ? (
                            article.content.split('\n\n').map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                            ))
                        ) : (
                            <p>{article.summary}</p>
                        )}
                    </div>

                    {/* Multi-Source Cluster Rail */}
                    {article.other_sources && article.other_sources.length > 0 && (
                        <div className="mt-8 p-4 bg-muted/60 border border-border/80 rounded-2xl space-y-3">
                            <h4 className="text-xs font-mono font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-accent" /> Other Outlets Covering This Event
                            </h4>
                            <div className="space-y-2">
                                {article.other_sources.map((src) => (
                                    <a
                                        key={src.id}
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-card dark:bg-paper hover:text-accent transition-colors"
                                    >
                                        <span className="font-bold text-accent">{src.source}</span>
                                        <span className="text-[10px] font-mono text-secondary line-clamp-1 max-w-[200px]">{src.title}</span>
                                        <ExternalLink className="w-3 h-3 text-secondary shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Original Source Link */}
                    <div className="pt-4 border-t border-border/40 text-center">
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-accent hover:underline py-2 px-4 bg-accent/10 rounded-full"
                        >
                            Read Original Source at {article.source} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* One-Handed Sticky Bottom Action Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-card/95 dark:bg-background/95 backdrop-blur-xl border-t border-border px-4 flex items-center justify-between shrink-0 shadow-lg">
                    {/* Font Size Adjuster (A- / A+) */}
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                        <button
                            onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                            className="w-10 h-10 flex items-center justify-center font-bold text-xs hover:bg-card rounded-lg active:scale-95 text-secondary"
                            aria-label="Decrease Font Size"
                        >
                            A-
                        </button>
                        <Type className="w-3.5 h-3.5 text-secondary" />
                        <button
                            onClick={() => setFontSize(prev => Math.min(26, prev + 2))}
                            className="w-10 h-10 flex items-center justify-center font-bold text-sm hover:bg-card rounded-lg active:scale-95 text-primary"
                            aria-label="Increase Font Size"
                        >
                            A+
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-muted text-primary active:scale-95 transition-transform"
                            aria-label="Share"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => toggleBookmark(article)}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-transform active:scale-95 ${
                                saved ? 'bg-accent text-white' : 'bg-muted text-primary'
                            }`}
                            aria-label="Bookmark"
                        >
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                        </button>

                        <button
                            onClick={onClose}
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-brand text-card active:scale-95 transition-transform"
                            aria-label="Close"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
