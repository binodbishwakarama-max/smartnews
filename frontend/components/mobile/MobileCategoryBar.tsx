'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const CATEGORIES = [
    'For You', 'Latest', 'World', 'Business', 'Technology', 'AI & Startups', 'Science', 'Health', 'Politics', 'Culture', 'Sports', 'Environment', 'Education'
];

interface MobileCategoryBarProps {
    onSelectCategory?: (category: string) => void;
}

export default function MobileCategoryBar({ onSelectCategory }: MobileCategoryBarProps) {
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category') || 'Latest';

    return (
        <div className="md:hidden bg-card/90 dark:bg-background/90 border-b border-border/80 py-2 select-none sticky top-14 z-30 backdrop-blur-md">
            <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory px-4 touch-pan-x">
                {CATEGORIES.map(cat => {
                    const isActive = currentCategory === cat || (cat === 'Latest' && currentCategory === 'Latest');
                    const isForYou = cat === 'For You';

                    return (
                        <Link
                            key={cat}
                            href={cat === 'Latest' ? '/' : `/?category=${encodeURIComponent(cat)}`}
                            prefetch={true}
                            onClick={() => onSelectCategory?.(cat)}
                            className={`snap-start min-h-[40px] px-3.5 flex items-center justify-center rounded-full text-xs font-mono font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 active:scale-95 ${
                                isActive 
                                    ? 'bg-accent text-white shadow-sm font-black' 
                                    : 'bg-muted/70 text-secondary hover:text-primary hover:bg-muted'
                            }`}
                        >
                            {isForYou && <span className="mr-1 text-[10px]">✦</span>}
                            {cat}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
