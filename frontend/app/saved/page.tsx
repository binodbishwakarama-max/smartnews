'use client';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { NewsCard } from '@/components/EditorialComponents';
import { Bookmark, Inbox } from 'lucide-react';
import Link from 'next/link';

export default function BookmarksPage() {
    const { bookmarks } = useBookmarks();

    return (
        <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12 border-b-4 border-black dark:border-white pb-6 flex items-end justify-between">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter uppercase mb-4">
                            Saved Stories
                        </h1>
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-secondary">
                            Your Personal Reading List • {bookmarks.length} Article{bookmarks.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Bookmark className="w-12 h-12 text-accent" />
                </div>

                {bookmarks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
                        {bookmarks.map((article) => (
                            <NewsCard key={article.id} article={article} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-border rounded-lg bg-muted/30">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                            <Inbox className="w-10 h-10 text-secondary" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold mb-4">Your reading list is empty</h2>
                        <p className="text-secondary max-w-md mb-8 leading-relaxed">
                            Click the bookmark icon <Bookmark className="w-4 h-4 inline mx-1" /> on any story to save it here for later reading. Use this space to curate your daily briefing.
                        </p>
                        <Link
                            href="/"
                            className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform"
                        >
                            Browse Latest News
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
