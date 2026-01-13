import Link from 'next/link';
import { Article } from '../app/page';
import { formatDate, formatTime } from '../lib/dateUtils';
import BookmarkButton from './BookmarkButton';

export function NewsCard({ article, horizontal = false, dense = false }: { article: Article, horizontal?: boolean, dense?: boolean }) {
    if (horizontal) {
        return (
            <article className="group flex gap-6 items-start py-6 border-b border-border relative">
                <div className="news-image-wrap w-24 h-24 flex-shrink-0 bg-muted">
                    <img src={article.image_url || ''} alt="" loading="lazy" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                    <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent">{article.category}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <BookmarkButton article={article} />
                        </div>
                    </div>
                    <h3 className="text-lg font-serif font-bold leading-tight group-hover:underline pr-8">
                        <Link href={article.url} target="_blank">{article.title}</Link>
                    </h3>
                    <span className="text-[10px] text-secondary font-bold uppercase">{article.source} • {formatDate(article.publish_date)}</span>
                </div>
            </article>
        );
    }

    return (
        <article className={`group flex flex-col gap-4 ${!dense ? 'pb-8 border-b border-border' : ''} relative`}>
            <div className="news-image-wrap aspect-[16/9] bg-muted relative">
                <img src={article.image_url || ''} alt={article.title} loading="lazy" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <BookmarkButton article={article} className="bg-white/90 dark:bg-black/80 backdrop-blur-sm rounded-full shadow-lg" />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">{article.category || 'News'}</span>
                <h3 className={`${dense ? 'text-lg' : 'text-2xl'} font-serif font-bold leading-tight group-hover:underline`}>
                    <Link href={article.url} target="_blank">{article.title}</Link>
                </h3>
                {!dense && (
                    <p className="text-secondary text-sm leading-relaxed line-clamp-3 font-sans">
                        {article.summary || article.title}
                    </p>
                )}
                <div className="flex items-center justify-between mt-2">
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
    return (
        <section className="group py-8 border-b-2 border-black mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 news-image-wrap aspect-[16/9] shadow-inner relative">
                    <img src={article.image_url || ''} alt={article.title} loading="eager" />
                    <div className="absolute top-4 right-4 z-10">
                        <BookmarkButton article={article} className="bg-white/90 dark:bg-black/80 backdrop-blur-sm p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                <div className="lg:col-span-4 flex flex-col justify-center gap-6">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                            <span className="w-2 h-2 bg-accent animate-pulse"></span>
                            Lead Development
                        </span>
                        <BookmarkButton article={article} showText />
                    </div>

                    <h2 className="text-4xl lg:text-6xl font-serif font-black leading-none group-hover:underline decoration-4 underline-offset-8">
                        <Link href={article.url} target="_blank">{article.title}</Link>
                    </h2>
                    <p className="text-secondary text-lg leading-relaxed font-sans font-medium">
                        {article.summary || "High-priority analysis on today's defining global event. Our editorial team has flagged this development for immediate attention."}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest pt-4">
                        <div className="px-2 py-1 bg-black text-white">{article.source}</div>
                        <span>{formatDate(article.publish_date)}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
