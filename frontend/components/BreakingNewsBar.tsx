'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Article } from '../app/page';
import { API_BASE_URL, API_ENDPOINTS } from '../lib/config';
import { useReader } from '../contexts/ReaderContext';
import { safeApiRequest } from '../lib/api';

const MAX_TICKER_ITEMS = 5;
const ROTATE_INTERVAL = 5000; // ms between auto-rotations

export default function BreakingNewsBar() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [dismissed, setDismissed] = useState(false);
    const [visible, setVisible] = useState(false);
    const { openReader } = useReader();
    const rotateTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load 3 most recent articles on mount
    useEffect(() => {
        async function loadRecent() {
            try {
                const data = await safeApiRequest<{ articles?: Article[] } | Article[]>(
                    `${API_ENDPOINTS.ARTICLES}?limit=5&offset=0`,
                    { skipRetry: false }
                );
                if (!data) return;
                const items: Article[] = (Array.isArray(data) ? data : data.articles || []).slice(0, MAX_TICKER_ITEMS);
                if (items.length > 0) {
                    setArticles(items);
                    setVisible(true);
                }
            } catch {}
        }
        loadRecent();
    }, []);

    // SSE: prepend newest articles to ticker in real-time
    useEffect(() => {
        const streamUrl = `${API_BASE_URL}/api/v1/articles/stream`;
        let es: EventSource;
        let mounted = true;

        function connect() {
            es = new EventSource(streamUrl);
            es.onmessage = (event) => {
                if (!mounted) return;
                try {
                    const article = JSON.parse(event.data) as Article;
                    setArticles(prev => {
                        const exists = prev.some(a => a.id === article.id);
                        if (exists) return prev;
                        return [article, ...prev].slice(0, MAX_TICKER_ITEMS);
                    });
                    setActiveIdx(0);
                    setVisible(true);
                } catch {}
            };
        }
        connect();
        return () => { mounted = false; es?.close(); };
    }, []);

    // Auto-rotate ticker
    useEffect(() => {
        if (articles.length <= 1) return;
        rotateTimer.current = setInterval(() => {
            setActiveIdx(i => (i + 1) % articles.length);
        }, ROTATE_INTERVAL);
        return () => { if (rotateTimer.current) clearInterval(rotateTimer.current); };
    }, [articles.length]);

    const prev = useCallback(() => {
        setActiveIdx(i => (i - 1 + articles.length) % articles.length);
        if (rotateTimer.current) clearInterval(rotateTimer.current);
    }, [articles.length]);

    const next = useCallback(() => {
        setActiveIdx(i => (i + 1) % articles.length);
        if (rotateTimer.current) clearInterval(rotateTimer.current);
    }, [articles.length]);

    if (dismissed || !visible || articles.length === 0) return null;

    const current = articles[activeIdx];

    return (
        <div className="breaking-news-bar w-full bg-accent text-white z-[60] flex items-center min-h-[36px] relative overflow-hidden">
            {/* Animated red gradient shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-accent to-red-700 animate-shimmer opacity-50 pointer-events-none" />

            {/* Label */}
            <div className="relative flex-shrink-0 flex items-center gap-1.5 px-4 border-r border-white/20 self-stretch bg-black/20">
                <span className="w-2 h-2 rounded-full bg-white animate-ping absolute" />
                <span className="w-2 h-2 rounded-full bg-white relative" />
                <AlertTriangle className="w-3.5 h-3.5 ml-3 flex-shrink-0" />
                <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] whitespace-nowrap">Breaking</span>
            </div>

            {/* Article ticker */}
            <div className="relative flex-1 overflow-hidden px-4 min-w-0 flex items-center">
                <button
                    onClick={() => openReader(current.id)}
                    className="text-[11px] font-mono font-bold tracking-wide truncate text-left hover:underline transition-all cursor-pointer"
                    key={current.id}
                >
                    <span className="text-white/60 mr-2 text-[9px]">[{current.source?.toUpperCase()}]</span>
                    {current.title}
                </button>
            </div>

            {/* Navigation */}
            {articles.length > 1 && (
                <div className="relative flex items-center gap-1 px-2 border-l border-white/20 self-stretch">
                    <button onClick={prev} className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer" aria-label="Previous">
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[9px] font-mono font-black opacity-70 w-8 text-center">{activeIdx + 1}/{articles.length}</span>
                    <button onClick={next} className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer" aria-label="Next">
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Dismiss */}
            <button
                onClick={() => setDismissed(true)}
                className="relative p-2 hover:bg-white/10 self-stretch flex items-center border-l border-white/20 transition-colors cursor-pointer"
                aria-label="Dismiss breaking news bar"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
