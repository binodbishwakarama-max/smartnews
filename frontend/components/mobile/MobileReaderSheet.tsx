'use client';
import { useState, useEffect, useRef } from 'react';
import type { Article } from '../../app/page';
import { 
    X, Bookmark, Share2, Type, ExternalLink, Sparkles, Clock, ChevronDown,
    Play, Pause, Square, Volume2, Settings2
} from 'lucide-react';
import { useBookmarks } from '../../contexts/BookmarkContext';
import { getArticleById } from '../../lib/api';

interface MobileReaderSheetProps {
    articleId: number;
    onClose: () => void;
}

export default function MobileReaderSheet({ articleId, onClose }: MobileReaderSheetProps) {
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Preferences
    const [theme, setTheme] = useState<'light' | 'sepia' | 'dark' | 'slate'>('sepia');
    const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
    const [fontSize, setFontSize] = useState<number>(18);
    const [showSettings, setShowSettings] = useState(false);
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const [copied, setCopied] = useState(false);

    // Audio / Text-To-Speech (TTS) State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRate] = useState<number>(1.0);
    const synthRef = useRef<SpeechSynthesis | null>(null);

    // Initialize TTS & fetch article details
    useEffect(() => {
        let mounted = true;
        setLoading(true);

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }

        getArticleById(articleId)
            .then(data => {
                if (mounted && data) setArticle(data);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        document.body.style.overflow = 'hidden';
        return () => {
            mounted = false;
            document.body.style.overflow = '';
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, [articleId]);

    // Speech Control Handlers
    const handlePlayTTS = () => {
        if (!article || !synthRef.current) return;

        if (isPaused) {
            synthRef.current.resume();
            setIsPlaying(true);
            setIsPaused(false);
            return;
        }

        synthRef.current.cancel();
        const cleanContent = (article.content || article.summary || '')
            .replace(/<[^>]*>?/gm, '')
            .replace(/http\S+/g, '');
        
        const textToRead = `${article.title}. ${cleanContent}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = rate;

        utterance.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        utterance.onerror = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        synthRef.current.speak(utterance);
        setIsPlaying(true);
        setIsPaused(false);
    };

    const handlePauseTTS = () => {
        if (synthRef.current && isPlaying) {
            synthRef.current.pause();
            setIsPlaying(false);
            setIsPaused(true);
        }
    };

    const handleStopTTS = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsPlaying(false);
            setIsPaused(false);
        }
    };

    const toggleRate = () => {
        const rates = [1.0, 1.25, 1.5];
        const nextIdx = (rates.indexOf(rate) + 1) % rates.length;
        const newRate = rates[nextIdx];
        setRate(newRate);
        if (isPlaying && synthRef.current) {
            handleStopTTS();
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

                {/* 3. Settings Drawer Overlay (Theme & Font controls) */}
                {showSettings && (
                    <div className="p-4 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 space-y-3 shrink-0 animate-in fade-in duration-200">
                        {/* Theme Chips */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold uppercase text-[10px] opacity-70">Theme</span>
                            <div className="flex gap-1.5">
                                {(['light', 'sepia', 'dark', 'slate'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTheme(t)}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all ${
                                            theme === t ? 'border-accent bg-accent text-white shadow-sm' : 'border-black/20 dark:border-white/20 opacity-80'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Family */}
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold uppercase text-[10px] opacity-70">Font</span>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setFontFamily('serif')}
                                    className={`px-3 py-1 rounded-lg text-xs font-serif ${
                                        fontFamily === 'serif' ? 'bg-accent text-white font-bold' : 'opacity-80'
                                    }`}
                                >
                                    Serif
                                </button>
                                <button
                                    onClick={() => setFontFamily('sans')}
                                    className={`px-3 py-1 rounded-lg text-xs font-sans ${
                                        fontFamily === 'sans' ? 'bg-accent text-white font-bold' : 'opacity-80'
                                    }`}
                                >
                                    Sans
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5 pb-24">
                    {/* Source & Date Header */}
                    <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider opacity-80 border-b border-black/10 dark:border-white/10 pb-3">
                        <span className="font-black text-accent">{article.source}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formattedDate}</span>
                    </div>

                    {/* Headline */}
                    <h2 className={`text-2xl ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} font-black leading-tight`}>
                        {article.title}
                    </h2>

                    {/* Featured Image */}
                    {article.image_url && (
                        <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black/10">
                            <img 
                                src={article.image_url} 
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Article Body Content */}
                    <div 
                        className={`${fontFamily === 'serif' ? 'font-serif' : 'font-sans'} leading-relaxed space-y-4`}
                        style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
                    >
                        {article.content ? (
                            article.content.split('\n\n').map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                            ))
                        ) : (
                            <p>{article.summary}</p>
                        )}
                    </div>

                    {/* Multi-Source Cluster Rail */}
                    {article.other_sources && article.other_sources.length > 0 && (
                        <div className="mt-8 p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl space-y-3">
                            <h4 className="text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-accent" /> Other Outlets Covering This Event
                            </h4>
                            <div className="space-y-2">
                                {article.other_sources.map((src) => (
                                    <a
                                        key={src.id}
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:text-accent transition-colors"
                                    >
                                        <span className="font-bold text-accent">{src.source}</span>
                                        <span className="text-[10px] font-mono opacity-80 line-clamp-1 max-w-[180px]">{src.title}</span>
                                        <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Original Source Link */}
                    <div className="pt-4 border-t border-black/10 dark:border-white/10 text-center">
                        <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-mono font-black uppercase tracking-wider text-accent hover:underline py-2.5 px-5 bg-accent/10 rounded-full"
                        >
                            Read Original Article at {article.source} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                {/* 5. One-Handed Sticky Bottom Action Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-card/95 dark:bg-background/95 backdrop-blur-xl border-t border-border px-4 flex items-center justify-between shrink-0 shadow-lg">
                    {/* Font Size Adjuster (A- / A+) */}
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                        <button
                            onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                            className="w-10 h-10 flex items-center justify-center font-bold text-xs hover:bg-card rounded-lg active:scale-95 text-secondary"
                            aria-label="Decrease Font Size"
                        >
                            A-
                        </button>
                        <Type className="w-3.5 h-3.5 text-secondary" />
                        <button
                            onClick={() => setFontSize(prev => Math.min(26, prev + 2))}
                            className="w-10 h-10 flex items-center justify-center font-bold text-sm hover:bg-card rounded-lg active:scale-95 text-primary"
                            aria-label="Increase Font Size"
                        >
                            A+
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-muted text-primary active:scale-95 transition-transform"
                            aria-label="Share"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => toggleBookmark(article)}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-transform active:scale-95 ${
                                saved ? 'bg-accent text-white' : 'bg-muted text-primary'
                            }`}
                            aria-label="Bookmark"
                        >
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                        </button>

                        <button
                            onClick={onClose}
                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-brand text-card active:scale-95 transition-transform"
                            aria-label="Close"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
