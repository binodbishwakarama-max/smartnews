import Link from 'next/link';

interface TrendingTopic {
    topic: string;
    article_count: number;
}

export default function TrendingSidebar({ topics }: { topics: TrendingTopic[] }) {
    return (
        <aside className="flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b-2 border-primary pb-2">
                <h3 className="text-xl font-black uppercase tracking-tighter">Trending</h3>
            </div>
            <div className="flex flex-col divide-y divide-border">
                {topics.map((t, i) => (
                    <Link
                        key={i}
                        href={`/?category=${t.topic}`}
                        className="group py-4 flex gap-4 items-start"
                    >
                        <span className="text-3xl font-black text-border group-hover:text-brand transition-colors italic">
                            0{i + 1}
                        </span>
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm uppercase tracking-wider group-hover:underline">
                                {t.topic}
                            </span>
                            <span className="text-[10px] text-secondary font-bold uppercase tracking-widest">
                                {t.article_count} Stories
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Newsletter Signup (Editorial Style) */}
            <div className="bg-muted p-6 mt-4">
                <h4 className="font-serif text-xl font-bold mb-2">The Intelligence</h4>
                <p className="text-secondary text-sm mb-4">Daily analysis of the events that matter, delivered to your inbox.</p>
                <div className="flex flex-col gap-2">
                    <input
                        type="email"
                        placeholder="email@example.com"
                        className="bg-white border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                    <button className="bg-primary text-white py-2 text-xs font-bold uppercase tracking-widest hover:bg-brand transition-colors">
                        Subscribe
                    </button>
                </div>
            </div>
        </aside>
    );
}
