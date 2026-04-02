/**
 * Global Configuration
 * 
 * Environment-specific settings for robust frontend-backend connection
 * 
 * NEXT_PUBLIC_API_URL should be set in Vercel/Netlify dashboard for production.
 * For local development, it defaults to http://127.0.0.1:8000
 */

// API Base URL with fallback
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// API Endpoints
export const API_ENDPOINTS = {
    ARTICLES: `${API_BASE_URL}/api/v1/articles`,
    SEARCH: `${API_BASE_URL}/api/v1/articles/search`,
    TRENDING: `${API_BASE_URL}/api/v1/trending`,
    STATS: `${API_BASE_URL}/news/stats`,
    QUICK_FEED: `${API_BASE_URL}/news/quick-feed`,
    HEALTH: `${API_BASE_URL}/health`,
    // Auth endpoints
    LOGIN: `${API_BASE_URL}/api/v1/auth/login/access-token`,
    SIGNUP: `${API_BASE_URL}/api/v1/auth/signup`,
    // Scraper endpoints
    SCRAPER_TRIGGER: `${API_BASE_URL}/api/v1/scraper/scrape`,
    SCRAPER_STATUS: `${API_BASE_URL}/api/v1/scraper/status`,
    SCRAPER_CLEANUP: `${API_BASE_URL}/api/v1/scraper/cleanup`,
};

// Connection Settings
export const CONNECTION_CONFIG = {
    // Request timeout in milliseconds
    REQUEST_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || '10000'),

    // Maximum retry attempts for failed requests
    MAX_RETRIES: parseInt(process.env.NEXT_PUBLIC_MAX_RETRIES || '3'),

    // Initial retry delay in milliseconds
    INITIAL_RETRY_DELAY: 1000,

    // Cache revalidation time in seconds
    REVALIDATE_TIME: parseInt(process.env.NEXT_PUBLIC_REVALIDATE_TIME || '120'),

    // Enable debug logging
    DEBUG_MODE: process.env.NODE_ENV === 'development',
};

// Feature Flags
export const FEATURES = {
    ENABLE_OFFLINE_MODE: process.env.NEXT_PUBLIC_ENABLE_OFFLINE === 'true',
    ENABLE_ERROR_REPORTING: process.env.NEXT_PUBLIC_ERROR_REPORTING === 'true',
};

// Validate configuration on load
if (typeof window !== 'undefined' && CONNECTION_CONFIG.DEBUG_MODE) {
    console.log('🔧 Config loaded:', {
        API_BASE_URL,
        CONNECTION_CONFIG,
        FEATURES,
    });
}
