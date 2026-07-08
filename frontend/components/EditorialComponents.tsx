import Link from 'next/link';
import { Article } from '../app/page';
import { formatDate, formatTime } from '../lib/dateUtils';
import BookmarkButton from './BookmarkButton';
import { Sparkles } from 'lucide-react';

export function NewsCard({ article, horizontal = false, dense = false }: { article: Article, horizontal?: boolean, dense?: boolean }) {
    const curationScore = ((article.quality_score || 75.0) / 10).toFixed(1);

    if (horizontal) {
        return (
            <article className="group flex gap-4 items-start py-4 border-b border-border/60 hover:bg-card/20 dark:hover:bg-paper/20 p-2 rounded-xl transition-all duration-300 relative">
                <div className="news-image-wrap w-20 h-20 flex-shrink-0 bg-muted rounded-lg overflow-hidden shadow-sm relative">
                    <img src={article.image_url || '/placeholder.jpg'} alt={article.title || 'News image'} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent">{article.category}</span>
                            <span className="flex items-center gap-0.5 text-[9px] font-black bg-accent/10 dark:bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                                <Sparkles className="w-2.5 h-2.5 text-accent" />
                                {curationScore}
                            </span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <BookmarkButton article={article} />
                        </div>
                    </div>
                    <h3 className="text-sm md:text-base font-serif font-bold leading-tight group-hover:text-accent transition-colors line-clamp-2 pr-4">
                        <Link href={article.url} target="_blank">{article.title}</Link>
                    </h3>
                    <span className="text-[9px] text-secondary font-bold uppercase tracking-wide">{article.source} • {formatDate(article.publish_date)}</span>
                </div>
            </article>
        );
    }

    return (
        <article className={`group flex flex-col gap-4 p-4 rounded-2xl border border-transparent hover:border-border/60 dark:hover:border-border/30 bg-transparent hover:bg-card/40 dark:hover:bg-paper/45 backdrop-blur-sm transition-all duration-300 hover:shadow-xl relative ${!dense ? 'pb-6' : ''}`}>
            <div className="news-image-wrap aspect-[16/9] bg-muted relative rounded-xl overflow-hidden shadow-md">
                <img src={article.image_url || '/placeholder.jpg'} alt={article.title || 'News image'} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                
                {/* AI Curation Badge */}
                <div className="absolute top-3 left-3 z-10">
                    <div className="flex items-center gap-1 bg-black/75 dark:bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-md border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-105">
                        <Sparkles className="w-3 h-3 text-gold animate-pulse" />
                        <span className="tracking-wider">{curationScore} AI INDEX</span>
                    </div>
                </div>

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <BookmarkButton article={article} className="bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full shadow-lg p-1" />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">{article.category || 'News'}</span>
                <h3 className={`${dense ? 'text-lg' : 'text-xl md:text-2xl'} font-serif font-black leading-snug group-hover:text-accent transition-colors`}>
                    <Link href={article.url} target="_blank">{article.title}</Link>
                </h3>
                {!dense && (
                    <p className="text-secondary text-sm leading-relaxed line-clamp-3 font-sans font-medium">
                        {article.summary || article.title}
                    </p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider">{article.source}</span>
                        <span className="w-1 h-1 bg-border rounded-full"></span>
                        <span className="text-[11px] text-secondary font-medium">{formatTime(article.publish_date)}</span>
                    </div>
                    <div className="md:hidden">
                        <BookmarkButton article={article} />
                    </div>
                </div>
            </div>
        </article>
    );
}

export function LeadStory({ article }: { article: Article }) {
    const curationScore = ((article.quality_score || 85.0) / 10).toFixed(1);
    const isUltraPremium = (article.quality_score || 85.0) >= 90.0;

    return (
        <section className="group py-8 border-b-2 border-brand mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 news-image-wrap aspect-[16/9] shadow-inner relative rounded-2xl overflow-hidden shadow-2xl">
                    <img src={article.image_url || ''} alt={article.title || 'Lead story image'} loading="eager" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    
                    {/* Curation Badge */}
                    <div className="absolute top-4 left-4 z-10">
                        <div className={`flex items-center gap-1.5 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full border shadow-xl transition-transform duration-500 group-hover:scale-105 ${
                            isUltraPremium 
                                ? 'bg-gold/90 border-gold text-black' 
                                : 'bg-black/85 dark:bg-slate-900/90 border-white/10'
                        }`}>
                            <Sparkles className={`w-3.5 h-3.5 ${isUltraPremium ? 'text-black animate-bounce' : 'text-gold animate-pulse'}`} />
                            <span className="tracking-widest">{curationScore} AI RATED LEAD</span>
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 z-10">
                        <BookmarkButton article={article} className="bg-white/90 dark:bg-black/80 backdrop-blur-sm p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                <div className="lg:col-span-4 flex flex-col justify-center gap-6">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-accent animate-ping rounded-full"></span>
                            Lead Development
                        </span>
                        <BookmarkButton article={article} showText />
                    </div>

                    <h2 className="text-3xl lg:text-5xl font-serif font-black leading-tight group-hover:text-accent transition-colors decoration-4 underline-offset-8">
                        <Link href={article.url} target="_blank">{article.title}</Link>
                    </h2>
                    <p className="text-secondary text-base lg:text-lg leading-relaxed font-sans font-medium">
                        {article.summary || "High-priority analysis on today's defining global event. Our editorial team has flagged this development for immediate attention."}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest pt-4 border-t border-border">
                        <div className="px-2.5 py-1 bg-brand text-background dark:text-black rounded font-black">{article.source}</div>
                        <span>{formatDate(article.publish_date)}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
