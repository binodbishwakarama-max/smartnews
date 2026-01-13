/**
 * Global Configuration
 * 
 * NEXT_PUBLIC_API_URL should be set in Vercel/Netlify dashboard for production.
 * For local development, it defaults to http://127.0.0.1:8000
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const API_ENDPOINTS = {
    ARTICLES: `${API_BASE_URL}/api/v1/articles`,
    SEARCH: `${API_BASE_URL}/api/v1/articles/search`,
    STATS: `${API_BASE_URL}/news/stats`,
    QUICK_FEED: `${API_BASE_URL}/news/quick-feed`,
};
