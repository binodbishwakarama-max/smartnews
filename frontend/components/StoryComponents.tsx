import Link from 'next/link';
import { Article } from '../app/page';

export function StoryCard({ article }: { article: Article }) {
    return (
        <article className="group flex flex-col gap-3">
            <div className="image-container rounded-sm">
                <img
                    src={article.image_url || '/placeholder.jpg'}
                    alt={article.title}
                    className="news-image"
                />
            </div>
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand">
                    {article.category || 'Breaking'}
                </span>
                <h3 className="headline-card">
                    <Link href={article.url} target="_blank">{article.title}</Link>
                </h3>
                <p className="text-secondary text-sm leading-relaxed line-clamp-2">
                    {article.summary || article.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="meta-text text-[10px]">{article.source}</span>
                    <span className="w-1 h-1 bg-border rounded-full"></span>
                    <span className="meta-text text-[10px]">
                        {new Date(article.publish_date).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </article>
    );
}

export function HeroStory({ article }: { article: Article }) {
    return (
        <section className="group grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 border-b-4 border-primary mb-12">
            <div className="lg:col-span-8">
                <div className="image-container aspect-[21/9] rounded-sm">
                    <img
                        src={article.image_url || '/placeholder.jpg'}
                        alt={article.title}
                        className="news-image"
                    />
                </div>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-center gap-4">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
                    Lead Story
                </span>
                <h2 className="text-4xl lg:text-5xl font-black leading-tight group-hover:text-brand transition-colors">
                    <Link href={article.url} target="_blank">{article.title}</Link>
                </h2>
                <p className="text-secondary text-lg leading-relaxed line-clamp-3">
                    {article.summary || "Read the full analysis on today's most significant global development."}
                </p>
                <div className="flex items-center gap-3 pt-2">
                    <span className="meta-text">{article.source}</span>
                    <span className="text-border">|</span>
                    <span className="meta-text">
                        {new Date(article.publish_date).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </section>
    );
}
