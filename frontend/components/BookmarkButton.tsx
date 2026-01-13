'use client';
import { Bookmark } from 'lucide-react';
import { useBookmarks, Article } from '../contexts/BookmarkContext';
import { useEffect, useState } from 'react';

interface BookmarkButtonProps {
    article: Article;
    className?: string;
    showText?: boolean;
}

export default function BookmarkButton({ article, className = "", showText = false }: BookmarkButtonProps) {
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const [isActive, setIsActive] = useState(false);

    // Sync local state with context to avoid hydration mismatches initially
    useEffect(() => {
        setIsActive(isBookmarked(article.id));
    }, [isBookmarked, article.id]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleBookmark(article);
        setIsActive(!isActive); // Optimistic UI update
    };

    return (
        <button
            onClick={handleClick}
            className={`group flex items-center gap-2 transition-all active:scale-95 ${className}`}
            title={isActive ? "Remove from bookmarks" : "Save for later"}
        >
            <div className={`relative p-2 rounded-full transition-colors duration-300 ${isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-secondary hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white'
                }`}>
                <Bookmark className={`w-5 h-5 transition-all duration-300 ${isActive ? 'fill-accent scale-110' : 'scale-100'
                    }`} />
            </div>

            {showText && (
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-accent' : 'text-secondary group-hover:text-black dark:group-hover:text-white'
                    }`}>
                    {isActive ? 'Saved' : 'Save'}
                </span>
            )}
        </button>
    );
}
