'use client';
import { useState, useEffect } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

interface Article {
    id: number;
    title: string;
    summary: string;
    category: string;
    source: string;
    url: string;
    image_url: string;
    publish_date: string;
}

interface LoadMoreButtonProps {
    onLoadMore: () => void;
    isLoading: boolean;
    hasMore: boolean;
    currentCount: number;
    totalCount: number;
}

export default function LoadMoreButton({
    onLoadMore,
    isLoading,
    hasMore,
    currentCount,
    totalCount
}: LoadMoreButtonProps) {
    const [isInView, setIsInView] = useState(false);

    // Auto-load when scrolled near bottom
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        const element = document.getElementById('load-more-trigger');
        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [hasMore, isLoading, onLoadMore]);

    if (!hasMore && currentCount > 0) {
        return (
            <div className="text-center py-12 border-t-2 border-black mt-12">
                <div className="inline-block px-6 py-3 bg-black text-white font-black uppercase tracking-widest text-sm">
                    ✓ All {totalCount} Articles Loaded
                </div>
                <p className="text-xs text-secondary mt-4">
                    You've reached the end of the feed
                </p>
            </div>
        );
    }

    if (!hasMore) {
        return null;
    }

    return (
        <div id="load-more-trigger" className="text-center py-12 mt-12 border-t-2 border-black">
            {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    <p className="text-sm font-bold uppercase tracking-widest text-secondary">
                        Loading More Articles...
                    </p>
                </div>
            ) : (
                <button
                    onClick={onLoadMore}
                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-black hover:bg-black hover:text-white transition-all transform hover:scale-105 active:scale-95 font-black uppercase tracking-widest text-sm"
                >
                    <span>Load More Articles</span>
                    <ChevronDown className="w-5 h-5 group-hover:animate-bounce" />
                </button>
            )}
            <p className="text-xs text-secondary mt-4">
                Showing {currentCount} of {totalCount} articles
            </p>
        </div>
    );
}
