import Link from 'next/link';
import LivePulseWidget from './LivePulseWidget';

interface TrendingTopic {
    topic: string;
    article_count: number;
}

export default function TrendingSidebar({ topics }: { topics: TrendingTopic[] }) {
    return (
        <aside className="flex flex-col gap-8">
            <div className="flex items-center gap-2 border-b-4 border-double border-brand pb-2">
                <h3 className="text-xl font-serif font-black uppercase tracking-tighter">Trending Topics</h3>
            </div>
            <div className="flex flex-col divide-y divide-border">
                {topics.map((t, i) => (
                    <Link
                        key={i}
                        href={`/?category=${t.topic}`}
                        className="group py-4 flex gap-4 items-start hover:bg-card/40 px-2 transition-all duration-300"
                    >
                        <span className="text-3xl font-serif font-black text-accent/80 group-hover:text-accent transition-colors italic">
                            0{i + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                            <span className="font-serif font-bold text-sm uppercase tracking-wide group-hover:underline">
                                {t.topic}
                            </span>
                            <span className="text-[9px] text-secondary font-mono font-bold uppercase tracking-widest">
                                {t.article_count} COVERAGES
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Live Newsroom Pulse Dashboard */}
            <LivePulseWidget />

            {/* Newsletter Signup (Editorial Style) */}
            <div className="bg-card border-2 border-brand dark:border-border p-6 shadow-[4px_4px_0px_0px_var(--color-brand)] dark:shadow-[4px_4px_0px_0px_var(--color-border)] rounded-none">
                <h4 className="font-serif text-lg font-black tracking-tight mb-2 uppercase">The Dispatch</h4>
                <p className="text-secondary text-[12px] font-medium leading-relaxed mb-4">
                    Daily insights on the events shaping our world, straight from the newsroom.
                </p>
                <div className="flex flex-col gap-3">
                    <input
                        type="email"
                        placeholder="reader@editorial.com"
                        className="bg-background border-2 border-brand dark:border-border rounded-none px-3 py-2 text-xs font-mono focus:outline-none focus:border-accent"
                    />
                    <button className="bg-brand text-background dark:bg-primary dark:text-background border-2 border-brand py-2.5 text-xs font-mono font-black uppercase tracking-widest hover:bg-accent hover:text-white dark:hover:bg-accent dark:hover:text-white transition-all transform active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] cursor-pointer">
                        SUBSCRIBE VOUCHER
                    </button>
                </div>
            </div>
        </aside>
    );
}
