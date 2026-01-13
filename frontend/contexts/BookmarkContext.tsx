'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Article } from '../app/page';

export type { Article };

interface BookmarkContextType {
    bookmarks: Article[];
    addBookmark: (article: Article) => void;
    removeBookmark: (articleId: number) => void;
    isBookmarked: (articleId: number) => boolean;
    toggleBookmark: (article: Article) => void;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
    const [bookmarks, setBookmarks] = useState<Article[]>([]);
    const [mounted, setMounted] = useState(false);

    // Load bookmarks from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('smartnews_bookmarks');
            if (saved) {
                setBookmarks(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
        }
        setMounted(true);
    }, []);

    // Save bookmarks to localStorage whenever they change
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('smartnews_bookmarks', JSON.stringify(bookmarks));
        }
    }, [bookmarks, mounted]);

    const addBookmark = (article: Article) => {
        setBookmarks(prev => {
            if (prev.some(b => b.id === article.id)) return prev;
            return [article, ...prev];
        });
    };

    const removeBookmark = (articleId: number) => {
        setBookmarks(prev => prev.filter(b => b.id !== articleId));
    };

    const isBookmarked = (articleId: number) => {
        return bookmarks.some(b => b.id === articleId);
    };

    const toggleBookmark = (article: Article) => {
        if (isBookmarked(article.id)) {
            removeBookmark(article.id);
        } else {
            addBookmark(article);
        }
    };

    // Hydration safe return - Always provide context!
    // The mounted check is only for local storage syncing.

    return (
        <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark, isBookmarked, toggleBookmark }}>
            {children}
        </BookmarkContext.Provider>
    );
}

export function useBookmarks() {
    const context = useContext(BookmarkContext);
    if (context === undefined) {
        throw new Error('useBookmarks must be used within a BookmarkProvider');
    }
    return context;
}
