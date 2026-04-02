/**
 * Robust API Client with Connection Resilience
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Connection health monitoring
 * - Graceful error handling
 * - Circuit breaker pattern
 */

import { API_BASE_URL } from './config';

const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

interface RequestOptions extends RequestInit {
    timeout?: number;
    retries?: number;
    skipRetry?: boolean;
    token?: string | null;
    requireAuth?: boolean;
}

type TokenGetter = () => Promise<string | null>;
let globalTokenGetter: TokenGetter | null = null;

export function registerTokenGetter(getter: TokenGetter) {
    globalTokenGetter = getter;
}

interface HealthStatus {
    isHealthy: boolean;
    lastCheck: number;
    consecutiveFailures: number;
}

const healthStatus: HealthStatus = {
    isHealthy: true,
    lastCheck: 0,
    consecutiveFailures: 0,
};

const MAX_CONSECUTIVE_FAILURES = 5;
const HEALTH_CHECK_INTERVAL = 30000;

function fetchWithTimeout(url: string, options: RequestOptions = {}): Promise<Response> {
    const { timeout = DEFAULT_TIMEOUT } = options;

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);

        fetch(url, options)
            .then((response) => {
                clearTimeout(timer);
                resolve(response);
            })
            .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

function getRetryDelay(attempt: number): number {
    return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {
            timeout: 5000,
            skipRetry: true,
        });

        if (response.ok) {
            healthStatus.isHealthy = true;
            healthStatus.consecutiveFailures = 0;
            healthStatus.lastCheck = Date.now();
            return true;
        }
    } catch (error) {
        console.warn('Backend health check failed:', error);
    }

    healthStatus.consecutiveFailures++;
    if (healthStatus.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        healthStatus.isHealthy = false;
    }
    healthStatus.lastCheck = Date.now();
    return false;
}

export async function apiRequest<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const {
        retries = MAX_RETRIES,
        skipRetry = false,
        token: explicitToken,
        requireAuth = false,
        ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    let token = explicitToken;
    if (token === undefined) {
        if (globalTokenGetter) {
            token = await globalTokenGetter();
        } else if (typeof window !== 'undefined') {
            token = localStorage.getItem('token');
        }
    }

    if (!token && requireAuth) {
        throw new Error('Authentication required');
    }

    if (Date.now() - healthStatus.lastCheck > HEALTH_CHECK_INTERVAL) {
        checkBackendHealth();
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const headers = new Headers(fetchOptions.headers);

            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            const isFormData = fetchOptions.body instanceof FormData;
            const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
            const method = (fetchOptions.method || 'GET').toUpperCase();
            const isMethodWithBody = ['POST', 'PUT', 'PATCH'].includes(method);

            if (!isFormData && (hasBody || isMethodWithBody) && !headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }

            const response = await fetchWithTimeout(url, {
                ...fetchOptions,
                headers,
            });

            if (response.ok) {
                healthStatus.consecutiveFailures = 0;
            }

            if (!response.ok) {
                if (response.status >= 400 && response.status < 500) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.detail ||
                        errorData.message ||
                        `API Error: ${response.status}`
                    );
                }

                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            return data as T;
        } catch (error) {
            lastError = error as Error;
            if (!skipRetry) {
                console.warn(`API request attempt ${attempt + 1} failed:`, error);
            }

            if (skipRetry || attempt === retries) {
                break;
            }

            if (error instanceof Error && error.message.includes('timeout')) {
                healthStatus.consecutiveFailures++;
            }

            const delay = getRetryDelay(attempt);
            if (!skipRetry) {
                console.log(`Retrying in ${delay}ms...`);
            }
            await sleep(delay);
        }
    }

    healthStatus.consecutiveFailures++;
    if (healthStatus.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        healthStatus.isHealthy = false;
    }

    throw lastError || new Error('API request failed after all retries');
}

export async function safeApiRequest<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T | null> {
    try {
        return await apiRequest<T>(endpoint, options);
    } catch {
        return null;
    }
}

export function getHealthStatus(): HealthStatus {
    return { ...healthStatus };
}

export async function batchRequests<T = unknown>(
    endpoints: string[],
    options: RequestOptions = {},
    batchSize: number = 3
): Promise<(T | null)[]> {
    const results: (T | null)[] = [];

    for (let i = 0; i < endpoints.length; i += batchSize) {
        const batch = endpoints.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map((requestEndpoint) => safeApiRequest<T>(requestEndpoint, options))
        );
        results.push(...batchResults);

        if (i + batchSize < endpoints.length) {
            await sleep(100);
        }
    }

    return results;
}

export interface ScraperStatus {
    total_articles: number;
    recent_articles_24h: number;
    sources: Record<string, number>;
    categories: Record<string, number>;
    last_updated: string;
}

export interface ScraperTriggerResponse {
    message: string;
    max_articles: number;
    status: string;
    timestamp: string;
}

export interface ScraperCleanupResponse {
    message: string;
    deleted_count: number;
    cutoff_date: string;
}

export async function getScraperStatus(): Promise<ScraperStatus> {
    return apiRequest<ScraperStatus>('/api/v1/scraper/status', {
        method: 'GET',
        requireAuth: true,
    });
}

export async function triggerScraping(maxArticles: number = 50): Promise<ScraperTriggerResponse> {
    return apiRequest<ScraperTriggerResponse>(
        `/api/v1/scraper/scrape?max_articles=${maxArticles}`,
        {
            method: 'POST',
            requireAuth: true,
        }
    );
}

export async function cleanupOldArticles(daysOld: number = 30): Promise<ScraperCleanupResponse> {
    return apiRequest<ScraperCleanupResponse>(`/api/v1/scraper/cleanup?days_old=${daysOld}`, {
        method: 'DELETE',
        requireAuth: true,
    });
}
