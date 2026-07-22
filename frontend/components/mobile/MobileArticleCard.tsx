'use client';
import { useState } from 'react';
import type { Article } from '../../app/page';
import { Bookmark, Share2, Clock, Sparkles } from 'lucide-react';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { useReader } from '../../contexts/ReaderContext';

interface MobileArticleCardProps {
    article: Article;
    isLead?: boolean;
}

export default function MobileArticleCard({ article, isLead = false }: MobileArticleCardProps) {
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const { openReader } = useReader();
    const [copied, setCopied] = useState(false);

    const saved = isBookmarked(article.id);

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleBookmark(article);
    };

    const formattedDate = article.publish_date 
        ? new Date(article.publish_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : 'Recent';

    if (isLead) {
        return (
            <article 
                onClick={() => openReader(article.id)}
                className="bg-card dark:bg-paper border border-border/80 rounded-2xl overflow-hidden shadow-sm active:bg-muted/30 transition-all select-none cursor-pointer mb-4"
            >
                {/* 16:9 Hero Aspect Image */}
                {article.image_url && (
                    <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden">
                        <img 
                            src={article.image_url} 
                            alt={article.title}
                            className="w-full h-full object-cover"
                            loading="eager"
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-brand/90 backdrop-blur-md text-card font-mono text-[9px] font-black uppercase tracking-widest rounded-md">
                            {article.category || 'Lead Story'}
                        </div>
                    </div>
                )}

                {/* 8-Point Grid Content (16px outer, 8px/12px inner) */}
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-secondary">
                        <span className="font-bold text-accent">{article.source}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formattedDate}</span>
                    </div>

                    <h2 className="text-xl font-serif font-bold text-primary leading-snug line-clamp-3">
                        {article.title}
                    </h2>

                    {article.summary && (
                        <p className="text-xs text-secondary leading-relaxed line-clamp-2">
                            {article.summary}
                        </p>
                    )}

                    {/* Touch Targets (Min 44x44px) */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        {article.other_sources && article.other_sources.length > 0 ? (
                            <span className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> +{article.other_sources.length} Sources
                            </span>
                        ) : (
                            <span className="text-[10px] font-mono text-secondary">Read Story →</span>
                        )}

                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleShare}
                                className="w-11 h-11 flex items-center justify-center rounded-xl text-secondary hover:text-primary active:scale-95 transition-transform"
                                aria-label="Share Article"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleBookmark}
                                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-transform active:scale-95 ${
                                    saved ? 'text-accent font-bold' : 'text-secondary hover:text-primary'
                                }`}
                                aria-label="Bookmark Article"
                            >
                                <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article 
            onClick={() => openReader(article.id)}
            className="bg-card dark:bg-paper border border-border/80 rounded-xl p-3 flex gap-3 items-start select-none cursor-pointer active:bg-muted/40 transition-colors mb-3 overflow-hidden"
        >
            {/* Thumbnail Image (84x84px constant preventing CLS) */}
            {article.image_url ? (
                <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted relative">
                    <img 
                        src={article.image_url} 
                        alt={article.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>
            ) : (
                <div className="w-20 h-20 shrink-0 rounded-lg bg-muted flex items-center justify-center text-secondary font-mono text-[9px] font-bold uppercase">
                    News
                </div>
            )}

            {/* Compact Article Detail */}
            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between text-[9px] font-mono uppercase tracking-wider text-secondary">
                    <span className="font-bold text-accent line-clamp-1">{article.source}</span>
                    <span className="shrink-0">{formattedDate}</span>
                </div>

                <h3 className="text-sm font-serif font-bold text-primary leading-snug line-clamp-2">
                    {article.title}
                </h3>

                <div className="flex items-center justify-between pt-1">
                    <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-secondary">
                        {article.category || 'News'}
                    </span>

                    <div className="flex items-center gap-1 -mr-2">
                        <button
                            onClick={handleBookmark}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-transform active:scale-95 ${
                                saved ? 'text-accent' : 'text-secondary'
                            }`}
                            aria-label="Bookmark"
                        >
                            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
