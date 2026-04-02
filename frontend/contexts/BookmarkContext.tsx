'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Article } from '../app/page';
import { useAuth } from './AuthContext';
import { apiRequest } from '../lib/api';

export type { Article };

interface BookmarkContextType {
    bookmarks: Article[];
    addBookmark: (article: Article) => Promise<void>;
    removeBookmark: (articleId: number) => Promise<void>;
    isBookmarked: (articleId: number) => boolean;
    toggleBookmark: (article: Article) => Promise<void>;
    isLoading: boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoaded: isAuthLoaded } = useAuth();
    const [bookmarks, setBookmarks] = useState<Article[]>([]);
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load from localStorage (fallback/offline)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('smartnews_bookmarks');
            if (saved) {
                setBookmarks(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Failed to load local bookmarks:', error);
        }
        setMounted(true);
    }, []);

    // Sync with backend if authenticated
    useEffect(() => {
        if (mounted && isAuthLoaded && isAuthenticated) {
            fetchBookmarks();
        }
    }, [mounted, isAuthLoaded, isAuthenticated]);

    async function fetchBookmarks() {
        setIsLoading(true);
        try {
            const data = await apiRequest<Article[]>('/api/v1/bookmarks');
            setBookmarks(data);
            // Also update local storage for offline access
            localStorage.setItem('smartnews_bookmarks', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to fetch bookmarks from server:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const addBookmark = async (article: Article) => {
        // Optimistic UI update
        const prevBookmarks = [...bookmarks];
        if (prevBookmarks.some(b => b.id === article.id)) return;

        const newBookmarks = [article, ...prevBookmarks];
        setBookmarks(newBookmarks);
        localStorage.setItem('smartnews_bookmarks', JSON.stringify(newBookmarks));

        if (isAuthenticated) {
            try {
                await apiRequest(`/api/v1/bookmarks/${article.id}`, { method: 'POST' });
            } catch (error) {
                console.error('Failed to save bookmark to server:', error);
                // Revert on failure? 
                // setBookmarks(prevBookmarks);
            }
        }
    };

    const removeBookmark = async (articleId: number) => {
        // Optimistic UI update
        const prevBookmarks = [...bookmarks];
        const newBookmarks = prevBookmarks.filter(b => b.id !== articleId);
        setBookmarks(newBookmarks);
        localStorage.setItem('smartnews_bookmarks', JSON.stringify(newBookmarks));

        if (isAuthenticated) {
            try {
                await apiRequest(`/api/v1/bookmarks/${articleId}`, { method: 'DELETE' });
            } catch (error) {
                console.error('Failed to remove bookmark from server:', error);
            }
        }
    };

    const isBookmarked = (articleId: number) => {
        return bookmarks.some(b => b.id === articleId);
    };

    const toggleBookmark = async (article: Article) => {
        if (isBookmarked(article.id)) {
            await removeBookmark(article.id);
        } else {
            await addBookmark(article);
        }
    };

    return (
        <BookmarkContext.Provider value={{
            bookmarks,
            addBookmark,
            removeBookmark,
            isBookmarked,
            toggleBookmark,
            isLoading
        }}>
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
