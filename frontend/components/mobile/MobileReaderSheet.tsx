'use client';
import { useState, useEffect, useRef } from 'react';
import { 
    X, Volume2, Bookmark, Share2, Sparkles, Check, Play, Pause, Square, 
    Type, Moon, Sun, BookOpen, Layers, Clock, Globe, ShieldCheck, Flame, Settings2
} from 'lucide-react';
import { API_ENDPOINTS, API_BASE_URL } from '../../lib/config';
import { apiRequest } from '../../lib/api';
import { useBookmarks } from '../../contexts/BookmarkContext';

interface ArticleDetail {
    id: number;
    title: string;
    content: string;
    summary: string;
    category: string;
    source: string;
    url: string;
    image_url?: string;
    publish_date: string;
    quality_score?: number;
    other_sources?: { id: number; source: string; title: string }[];
}

interface MobileReaderSheetProps {
    articleId: number | null;
    onClose: () => void;
}

export default function MobileReaderSheet({ articleId, onClose }: MobileReaderSheetProps) {
    const [article, setArticle] = useState<ArticleDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState(1.0);
    const [fontStyle, setFontStyle] = useState<'serif' | 'sans'>('serif');
    const [fontSize, setFontSize] = useState<number>(18);
    const [theme, setTheme] = useState<'light' | 'sepia' | 'dark' | 'slate'>('dark');
    const [showSettings, setShowSettings] = useState(false);
    const [copied, setCopied] = useState(false);

    const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Speech Synthesis
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    // Fetch Article Details when opened
    useEffect(() => {
        if (!articleId) {
            setArticle(null);
            return;
        }

        async function fetchDetail() {
            setLoading(true);
            try {
                const data = await apiRequest<ArticleDetail>(`${API_ENDPOINTS.ARTICLES}${articleId}/`);
                setArticle(data);
            } catch (err) {
                console.error("Failed to load article detail", err);
            } finally {
                setLoading(false);
            }
        }

        fetchDetail();

        return () => {
            handleStopTTS();
        };
    }, [articleId]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            handleStopTTS();
        };
    }, []);

    // Speech Control Handlers with Fail-Safe HTML5 Audio Fallback for Mobile Phones
    const handlePlayTTS = () => {
        if (!article) return;

        if (isPaused && audioRef.current) {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                setIsPaused(false);
            }).catch(() => {});
            return;
        }

        handleStopTTS();

        const cleanContent = (article.content || article.summary || '')
            .replace(/<[^>]*>?/gm, '')
            .replace(/http\S+/g, '');
        
        const textToRead = `${article.title}. ${cleanContent}`.trim();

        // 1. Try Native Web Speech API
        if (synthRef.current && 'SpeechSynthesisUtterance' in window) {
            try {
                const utterance = new SpeechSynthesisUtterance(textToRead);
                utterance.rate = rate;

                utterance.onend = () => {
                    setIsPlaying(false);
                    setIsPaused(false);
                };

                utterance.onerror = () => {
                    playFallbackHTML5Audio(textToRead);
                };

                synthRef.current.speak(utterance);
                setIsPlaying(true);
                setIsPaused(false);
                return;
            } catch (e) {
                console.warn('SpeechSynthesis failed, using HTML5 Audio fallback:', e);
            }
        }

        // 2. Fallback to Server HTML5 Audio Endpoint (Works on 100% of Mobile Devices)
        playFallbackHTML5Audio(textToRead);
    };

    const playFallbackHTML5Audio = (text: string) => {
        try {
            const shortText = text.substring(0, 300);
            const ttsUrl = `${API_BASE_URL}/api/v1/articles/tts?text=${encodeURIComponent(shortText)}`;
            const audio = new Audio(ttsUrl);
            audio.playbackRate = rate;
            audioRef.current = audio;

            audio.onended = () => {
                setIsPlaying(false);
                setIsPaused(false);
            };

            audio.onerror = () => {
                setIsPlaying(false);
                setIsPaused(false);
            };

            audio.play().then(() => {
                setIsPlaying(true);
                setIsPaused(false);
            }).catch(err => {
                console.error('Mobile HTML5 Audio play error:', err);
                setIsPlaying(false);
                setIsPaused(false);
            });
        } catch (err) {
            console.error('Mobile Audio fallback failed:', err);
            setIsPlaying(false);
            setIsPaused(false);
        }
    };

    const handlePauseTTS = () => {
        if (synthRef.current && isPlaying && synthRef.current.speaking) {
            synthRef.current.pause();
        } else if (audioRef.current && isPlaying) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setIsPaused(true);
    };

    const handleStopTTS = () => {
        if (synthRef.current) {
            try { synthRef.current.cancel(); } catch {}
        }
        if (audioRef.current) {
            try {
                audioRef.current.pause();
                audioRef.current = null;
            } catch {}
        }
        setIsPlaying(false);
        setIsPaused(false);
    };

    const toggleRate = () => {
        const rates = [1.0, 1.25, 1.5];
        const nextIdx = (rates.indexOf(rate) + 1) % rates.length;
        const newRate = rates[nextIdx];
        setRate(newRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = newRate;
        }
    };

    if (loading && !article) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm">
                <div className="w-full h-96 bg-card dark:bg-background rounded-t-3xl p-8 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin"></div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-secondary">Loading AI Reader Mode...</span>
                </div>
            </div>
        );
    }

    if (!article) return null;

    const saved = isBookmarked(article.id);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.summary,
                url: article.url,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(article.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formattedDate = article.publish_date
        ? new Date(article.publish_date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
          })
        : 'Today';

    // Theme container classes
    const themeBg = {
        light: 'bg-white text-slate-900',
        sepia: 'bg-[#fbf0d9] text-[#2c221e]',
        dark: 'bg-[#0f172a] text-slate-100',
        slate: 'bg-[#1e293b] text-slate-100',
    }[theme];

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md transition-opacity duration-300">
            {/* Backdrop click to dismiss */}
            <div className="flex-1 w-full" onClick={onClose} />

            {/* Bottom Sheet Container */}
            <div className={`relative w-full max-h-[92vh] min-h-[65vh] ${themeBg} rounded-t-3xl border-t-2 border-accent shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300`}>
                
                {/* 1. Header Drag Handle & Top Controls Bar */}
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-black/10 dark:border-white/10 shrink-0">
                    <div className="w-10" />
                    <div className="w-12 h-1.5 bg-black/20 dark:bg-white/20 rounded-full" />
                    
                    {/* Reader Controls Toggle */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 active:scale-95 transition-all text-xs font-mono font-bold flex items-center gap-1"
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>

                {/* 2. Audio Voice Player Toolbar */}
                <div className="px-4 py-2 bg-accent/10 border-b border-accent/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-accent" />
                        {isPlaying && (
                            <div className="flex items-end gap-0.5 h-3">
                                <span className="w-0.5 h-3 bg-accent animate-bounce rounded-full" />
                                <span className="w-0.5 h-2 bg-accent animate-bounce rounded-full [animation-delay:0.15s]" />
                                <span className="w-0.5 h-3.5 bg-accent animate-bounce rounded-full [animation-delay:0.3s]" />
                            </div>
                        )}
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-accent">
                            {isPlaying ? 'AI Reading Story...' : isPaused ? 'Audio Paused' : 'Listen Story'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {/* Speed Toggle */}
                        <button
                            onClick={toggleRate}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/20 text-accent hover:bg-accent hover:text-white transition-colors"
                        >
                            {rate}x
                        </button>

                        {/* Play / Pause / Stop */}
                        {!isPlaying && !isPaused ? (
                            <button
                                onClick={handlePlayTTS}
                                className="h-7 px-3 bg-accent text-white rounded-lg flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider active:scale-95 shadow-sm"
                            >
                                <Play className="w-3 h-3 fill-current" /> Read
                            </button>
                        ) : isPlaying ? (
                            <button
                                onClick={handlePauseTTS}
                                className="h-7 px-3 bg-amber-500 text-white rounded-lg flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider active:scale-95 shadow-sm"
                            >
                                <Pause className="w-3 h-3 fill-current" /> Pause
                            </button>
                        ) : (
                            <button
                                onClick={handlePlayTTS}
                                className="h-7 px-3 bg-accent text-white rounded-lg flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider active:scale-95 shadow-sm"
                            >
                                <Play className="w-3 h-3 fill-current" /> Resume
                            </button>
                        )}

                        {(isPlaying || isPaused) && (
                            <button
                                onClick={handleStopTTS}
                                className="p-1.5 bg-black/10 dark:bg-white/10 rounded-lg text-secondary active:scale-95"
                                aria-label="Stop Audio"
                            >
                                <Square className="w-3 h-3 fill-current" />
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. Settings Panel Dropdown */}
                {showSettings && (
                    <div className="px-6 py-4 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 space-y-4 shrink-0 animate-in slide-in-from-top duration-200">
                        {/* Theme Selectors */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-70">Theme</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTheme('light')}
                                    className={`w-7 h-7 rounded-full bg-white border border-slate-300 ${theme === 'light' ? 'ring-2 ring-accent' : ''}`}
                                />
                                <button
                                    onClick={() => setTheme('sepia')}
                                    className={`w-7 h-7 rounded-full bg-[#fbf0d9] border border-amber-300 ${theme === 'sepia' ? 'ring-2 ring-accent' : ''}`}
                                />
                                <button
                                    onClick={() => setTheme('dark')}
                                    className={`w-7 h-7 rounded-full bg-[#0f172a] border border-slate-700 ${theme === 'dark' ? 'ring-2 ring-accent' : ''}`}
                                />
                                <button
                                    onClick={() => setTheme('slate')}
                                    className={`w-7 h-7 rounded-full bg-[#1e293b] border border-slate-600 ${theme === 'slate' ? 'ring-2 ring-accent' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Font Family & Size Controls */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider opacity-70">Typography</span>
                            <div className="flex items-center gap-3">
                                <div className="flex rounded-lg bg-black/10 dark:bg-white/10 p-0.5">
                                    <button
                                        onClick={() => setFontStyle('serif')}
                                        className={`px-2 py-0.5 rounded text-xs font-serif ${fontStyle === 'serif' ? 'bg-accent text-white font-bold' : ''}`}
                                    >
                                        Serif
                                    </button>
                                    <button
                                        onClick={() => setFontStyle('sans')}
                                        className={`px-2 py-0.5 rounded text-xs font-sans ${fontStyle === 'sans' ? 'bg-accent text-white font-bold' : ''}`}
                                    >
                                        Sans
                                    </button>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                                        className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 font-bold text-xs active:scale-95"
                                    >
                                        A-
                                    </button>
                                    <span className="text-xs font-mono font-bold px-1">{fontSize}</span>
                                    <button
                                        onClick={() => setFontSize(prev => Math.min(26, prev + 2))}
                                        className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 font-bold text-xs active:scale-95"
                                    >
                                        A+
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Article Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    {/* Category & Source Badges */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-accent/20 text-accent font-mono font-black text-[10px] uppercase tracking-wider">
                            {article.category || 'World'}
                        </span>
                        <span className="text-xs font-mono font-bold uppercase opacity-60">
                            {article.source} • {formattedDate}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-serif font-black leading-tight mb-4">
                        {article.title}
                    </h1>

                    {/* Featured Image */}
                    {article.image_url && (
                        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6 border border-black/10 dark:border-white/10 shadow-md">
                            <img
                                src={article.image_url}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Full Article Body */}
                    <div 
                        className={`leading-relaxed space-y-4 ${fontStyle === 'serif' ? 'font-serif' : 'font-sans'}`}
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {(article.content || article.summary || '')
                            .split('\n\n')
                            .map((paragraph, idx) => (
                                <p key={idx} className="opacity-90 leading-relaxed">
                                    {paragraph}
                                </p>
                            ))}
                    </div>
                </div>

                {/* 5. Sticky Bottom Action Bar */}
                <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between shrink-0 bg-black/5 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => (saved ? removeBookmark(article.id) : addBookmark(article as any))}
                            className={`p-3 rounded-2xl border transition-all active:scale-95 ${
                                saved 
                                    ? 'bg-accent text-white border-accent' 
                                    : 'border-black/20 dark:border-white/20 hover:bg-black/10 dark:hover:bg-white/10'
                            }`}
                            aria-label="Bookmark Article"
                        >
                            <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
                        </button>

                        <button
                            onClick={handleShare}
                            className="p-3 rounded-2xl border border-black/20 dark:border-white/20 hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 relative"
                            aria-label="Share Article"
                        >
                            <Share2 className="w-5 h-5" />
                            {copied && (
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black text-white text-[10px] rounded font-mono font-bold whitespace-nowrap">
                                    Copied!
                                </span>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-accent text-white font-mono font-bold text-xs uppercase tracking-wider rounded-2xl active:scale-95 shadow-md"
                    >
                        Done Reading
                    </button>
                </div>

            </div>
        </div>
    );
}
