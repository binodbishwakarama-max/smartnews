import Link from 'next/link';

interface TrendingTopic {
    topic: string;
    article_count: number;
}

export default function TrendingSidebar({ topics }: { topics: TrendingTopic[] }) {
    return (
        <div className="flex flex-col">
            {topics.slice(0, 6).map((t, i) => (
                <Link
                    key={i}
                    href={`/?category=${t.topic}`}
                    className="group py-2.5 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 flex gap-3 items-baseline"
                >
                    <span className="text-lg font-serif font-black text-neutral-300 dark:text-neutral-700 leading-none">
                        {i + 1}
                    </span>
                    <div className="flex flex-col gap-0">
                        <span className="text-[13px] font-serif font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors leading-snug">
                            {t.topic}
                        </span>
                        <span className="text-[9px] font-sans text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">
                            {t.article_count} stories
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}
