'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, Square, Type, Volume2, Maximize2, Minimize2, ExternalLink, Award, Share2 } from 'lucide-react';
import type { Article } from '../app/page';
import { API_BASE_URL } from '../lib/config';
import { useReadingHistory } from '../contexts/ReadingHistoryContext';

interface ReaderModalProps {
  articleId: number | null;
  onClose: () => void;
}

export default function ReaderModal({ articleId, onClose }: ReaderModalProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Theme & layout preferences
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark' | 'slate'>('sepia');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [fontSize, setFontSize] = useState<number>(18);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voicesCount, setVoicesCount] = useState<number>(-1);
  const [ttsEngine, setTtsEngine] = useState<'cloud' | 'native'>('cloud');

  // Reading progress
  const [readPct, setReadPct] = useState(0);
  const [completed, setCompleted] = useState(false);
  const contentPanelRef = useRef<HTMLDivElement>(null);
  const { markCompleted, recordRead } = useReadingHistory();

  // Audio / TTS state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number>(-1);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackSentencesIdxRef = useRef<number>(0);

  // Load article
  useEffect(() => {
    if (articleId === null || articleId === undefined) return;
    const currentId: number = articleId;
    
    async function loadArticle() {
      setLoading(true);
      try {
        const { getArticleById } = await import('../lib/api');
        const data = await getArticleById(currentId);
        setArticle(data);
      } catch (error) {
        console.error('Failed to load article detail for reader:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadArticle();
    
    // Set synth reference and warm up voice cache
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      const updateVoices = () => {
        if (synthRef.current) {
          const v = synthRef.current.getVoices();
          setVoicesCount(v.length);
        }
      };
      
      updateVoices();
      synthRef.current.onvoiceschanged = updateVoices;
      
      // Secondary check after 200ms to guarantee Chrome finishes async load
      setTimeout(updateVoices, 200);
    } else {
      setVoicesCount(0);
    }

    // Cleanup speech on modal close or change
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current = null;
      }
    };
  }, [articleId]);

  // Record open + reset progress when article changes
  useEffect(() => {
    if (article) {
      recordRead(article.id, article.category);
      setReadPct(0);
      setCompleted(false);
    }
  }, [article?.id]);

  // Scroll progress tracker
  const handleScroll = useCallback(() => {
    const el = contentPanelRef.current;
    if (!el || !article) return;
    const scrolled = el.scrollTop;
    const total = el.scrollHeight - el.clientHeight;
    if (total <= 0) return;
    const pct = Math.round((scrolled / total) * 100);
    setReadPct(pct);
    if (pct >= 90 && !completed) {
      setCompleted(true);
      markCompleted(article.id);
    }
  }, [article?.id, completed]);

  if (!articleId) return null;

  // Split content into sentences for highlighting during read-aloud
  const sentences = article
    ? article.content
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 0)
    : [];

  // Start TTS Fallback using Google Translate HTTP Audio
  const playFallbackSpeech = () => {
    if (!article) return;
    
    // Stop any active fallback audio
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.pause();
      fallbackAudioRef.current = null;
    }

    const chunks = sentences.length > 0 ? sentences : [article.title, article.content];
    fallbackSentencesIdxRef.current = 0;
    setIsPlaying(true);
    setIsPaused(false);

    const playNextChunk = () => {
      if (fallbackSentencesIdxRef.current >= chunks.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSentenceIdx(-1);
        return;
      }

      const chunkText = chunks[fallbackSentencesIdxRef.current];
      setCurrentSentenceIdx(fallbackSentencesIdxRef.current);

      // Clean up string to avoid excessive length limits
      let cleanText = chunkText.trim();
      if (cleanText.length > 200) {
        cleanText = cleanText.substring(0, 197) + '...';
      }

      const url = `${API_BASE_URL}/api/v1/articles/tts?text=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(url);
      audio.playbackRate = rate;
      fallbackAudioRef.current = audio;

      audio.onended = () => {
        fallbackSentencesIdxRef.current++;
        playNextChunk();
      };

      audio.onerror = (e) => {
        console.error('Fallback audio playback error, skipping to next sentence:', e);
        fallbackSentencesIdxRef.current++;
        playNextChunk();
      };

      audio.play().catch(err => {
        console.error('Fallback audio play block:', err);
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSentenceIdx(-1);
      });
    };

    playNextChunk();
  };

  // Start TTS
  const startSpeech = () => {
    if (!article) return;
    
    // Reset any ongoing native speech
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    // Reset any active fallback audio
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.pause();
      fallbackAudioRef.current = null;
    }

    // Check if native voice dispatch is available or requested
    const voices = synthRef.current ? synthRef.current.getVoices() : [];
    if (ttsEngine === 'cloud' || voices.length === 0) {
      console.log('Using Cloud TTS reader fallback...');
      playFallbackSpeech();
      return;
    }
    
    const textToRead = `${article.title}. ${article.content}`;
    const newUtterance = new SpeechSynthesisUtterance(textToRead);
    newUtterance.rate = rate;
    newUtterance.lang = 'en-US';
    
    const englishVoice = voices.find(v => v.lang.startsWith('en-US')) || 
                        voices.find(v => v.lang.startsWith('en')) || 
                        voices[0];
    if (englishVoice) {
      newUtterance.voice = englishVoice;
    }
    
    // Parse individual sentences for highlighting
    let charAccumulator = 0;
    const sentenceRanges = sentences.map(s => {
      const start = charAccumulator;
      const end = charAccumulator + s.length;
      charAccumulator += s.length + 1; // plus space
      return { text: s, start, end };
    });

    newUtterance.onboundary = (event) => {
      if (event.name === 'sentence' || event.name === 'word') {
        const charIdx = event.charIndex;
        const idx = sentenceRanges.findIndex(r => charIdx >= r.start && charIdx <= r.end);
        if (idx !== -1) {
          setCurrentSentenceIdx(idx);
        }
      }
    };

    newUtterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIdx(-1);
    };

    newUtterance.onerror = (e) => {
      console.error('Speech synthesis error details:', e.error, e);
      // If native fails unexpectedly, try using Google Translate fallback automatically
      console.log('Native speech failed, falling back to HTTP Google Translate TTS...');
      playFallbackSpeech();
    };

    utteranceRef.current = newUtterance;
    setIsPlaying(true);
    setIsPaused(false);
    if (synthRef.current) {
      synthRef.current.speak(newUtterance);
    }
  };

  // Pause / Resume speech
  const togglePauseSpeech = () => {
    const voices = synthRef.current ? synthRef.current.getVoices() : [];
    if (ttsEngine === 'cloud' || voices.length === 0) {
      // Fallback Pause/Resume
      if (fallbackAudioRef.current) {
        if (isPaused) {
          fallbackAudioRef.current.play().catch(console.error);
          setIsPaused(false);
          setIsPlaying(true);
        } else {
          fallbackAudioRef.current.pause();
          setIsPaused(true);
          setIsPlaying(false);
        }
      }
      return;
    }

    if (!synthRef.current) return;
    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      synthRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  // Stop speech
  const stopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    if (fallbackAudioRef.current) {
      fallbackAudioRef.current.pause();
      fallbackAudioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSentenceIdx(-1);
  };

  // Adjust rate on the fly (requires restarting speech)
  const changeRate = (newRate: number) => {
    setRate(newRate);
    if (isPlaying || isPaused) {
      setTimeout(() => {
        startSpeech();
      }, 50);
    }
  };

  // Theme color maps
  const themeClasses = {
    light: 'bg-white text-slate-900 border-slate-200',
    sepia: 'bg-[#faf6eb] text-amber-950 border-[#eadfcc]',
    dark: 'bg-[#0a0f1d] text-slate-100 border-[#1a2238]',
    slate: 'bg-slate-900 text-slate-100 border-slate-800'
  };

  const menuThemeClasses = {
    light: 'bg-slate-100 text-slate-800 border-slate-200',
    sepia: 'bg-[#eadfcc] text-amber-950 border-[#dfd2bb]',
    dark: 'bg-[#151c30] text-slate-300 border-[#232c45]',
    slate: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  const getHighlightClass = () => {
    switch (theme) {
      case 'light': return 'bg-yellow-100 text-slate-900 px-1 rounded transition-colors duration-200';
      case 'sepia': return 'bg-amber-200/60 text-amber-950 px-1 rounded transition-colors duration-200';
      case 'dark': return 'bg-amber-400/20 text-amber-300 px-1 rounded transition-colors duration-200 border-b border-amber-400/30';
      case 'slate': return 'bg-sky-400/20 text-sky-200 px-1 rounded transition-colors duration-200 border-b border-sky-400/30';
    }
  };

  const qualityScore = article?.quality_score ? (article.quality_score / 10).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 transition-all duration-300">
      <div
        className={`w-full ${isFullscreen ? 'h-full max-w-none' : 'max-w-4xl h-[90vh] rounded-3xl'} flex flex-col shadow-2xl border transition-all duration-500 overflow-hidden ${themeClasses[theme]}`}
      >
        {/* Reading Progress Bar */}
        <div className="h-1 w-full bg-black/10 dark:bg-white/10 flex-shrink-0 relative overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-200 ease-out"
            style={{ width: `${readPct}%` }}
          />
          {completed && (
            <div className="absolute inset-0 bg-green-500 animate-pulse opacity-60" />
          )}
        </div>
        {/* Top Control Bar */}
        <header className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'sepia' ? 'border-amber-950/10' : 'border-border/30'}`}>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-accent/15 text-accent">
              Reader Mode
            </span>
            {qualityScore && (
              <span className="flex items-center gap-1.5 text-[9px] font-mono font-black px-2.5 py-1 rounded-none bg-gold/15 dark:bg-gold/25 text-gold border border-gold/20">
                <Award className="w-3.5 h-3.5 text-gold" />
                VERITY VALUE // {qualityScore}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Fullscreen Toggle */}
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)} 
              className={`p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5`}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            {/* Close */}
            <button 
              onClick={onClose}
              className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              title="Close Reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Toolbar (Typography & Audio Controls) */}
        <section className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 text-xs font-semibold ${menuThemeClasses[theme]}`}>
          {/* Typography Settings */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Font choice */}
            <div className="flex items-center gap-1 border border-black/10 dark:border-white/10 rounded-lg p-0.5">
              <button 
                onClick={() => setFontFamily('serif')} 
                className={`px-3 py-1 rounded-md font-serif ${fontFamily === 'serif' ? 'bg-accent text-white shadow-sm' : ''}`}
              >
                Serif
              </button>
              <button 
                onClick={() => setFontFamily('sans')} 
                className={`px-3 py-1 rounded-md font-sans ${fontFamily === 'sans' ? 'bg-accent text-white shadow-sm' : ''}`}
              >
                Sans
              </button>
            </div>

            {/* Font size control */}
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 opacity-75" />
              <button 
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
              >
                A-
              </button>
              <span className="font-bold text-center w-8">{fontSize}px</span>
              <button 
                onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
              >
                A+
              </button>
            </div>

            {/* Theme selector */}
            <div className="flex gap-1.5 items-center">
              {(['light', 'sepia', 'dark', 'slate'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    t === 'light' ? 'bg-white border-slate-300' :
                    t === 'sepia' ? 'bg-[#faf6eb] border-amber-200' :
                    t === 'dark' ? 'bg-[#0a0f1d] border-slate-700' :
                    'bg-slate-900 border-slate-800'
                  } ${theme === t ? 'ring-2 ring-accent scale-110' : 'opacity-80 hover:opacity-100'}`}
                  title={`${t.toUpperCase()} theme`}
                />
              ))}
            </div>
          </div>

          {/* Audio TTS Controls */}
          <div className="flex items-center gap-3 border-l border-black/10 dark:border-white/10 pl-4 flex-wrap">
            <Volume2 className="w-4 h-4 opacity-75" />
            <div className="flex items-center gap-1.5">
              {!isPlaying && !isPaused ? (
                <button
                  onClick={startSpeech}
                  className="flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent/90 text-white rounded-lg transition-transform active:scale-95 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Listen{voicesCount === 0 ? ' (Cloud)' : ''}
                </button>
              ) : (
                <>
                  <button
                    onClick={togglePauseSpeech}
                    className="flex items-center justify-center w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-transform active:scale-95"
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <button
                    onClick={stopSpeech}
                    className="flex items-center justify-center w-8 h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-transform active:scale-95"
                    title="Stop Listening"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                </>
              )}
            </div>

            {/* Narration Speed */}
            <select
              value={rate}
              onChange={(e) => changeRate(parseFloat(e.target.value))}
              className="bg-transparent border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 focus:ring-accent outline-none"
            >
              <option value="0.75" className="bg-card dark:bg-paper">0.75x Speed</option>
              <option value="1.0" className="bg-card dark:bg-paper">1.0x Speed</option>
              <option value="1.25" className="bg-card dark:bg-paper">1.25x Speed</option>
              <option value="1.5" className="bg-card dark:bg-paper">1.5x Speed</option>
              <option value="2.0" className="bg-card dark:bg-paper">2.0x Speed</option>
            </select>

            {/* Voice Engine Selector */}
            <select
              value={ttsEngine}
              onChange={(e) => {
                const newEngine = e.target.value as 'cloud' | 'native';
                setTtsEngine(newEngine);
                if (isPlaying || isPaused) {
                  stopSpeech();
                  setTimeout(() => startSpeech(), 100);
                }
              }}
              className="bg-transparent border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 focus:ring-accent outline-none"
              title="Voice Reader Engine"
            >
              <option value="cloud" className="bg-card dark:bg-paper">Cloud Voice (Default)</option>
              <option value="native" className="bg-card dark:bg-paper">System Voice</option>
            </select>
          </div>
        </section>

        {/* Content Panel */}
        <div
          ref={contentPanelRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 md:px-12 py-10 relative"
        >
          {/* Completion badge */}
          {completed && (
            <div className="sticky top-0 z-10 flex justify-center mb-4 pointer-events-none">
              <span className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-[10px] font-mono font-black uppercase tracking-widest rounded-none shadow-lg">
                ✅ Article Completed · {readPct}% read
              </span>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Optimizing layout...
              </span>
            </div>
          ) : article ? (
            <article 
              className={`max-w-2xl mx-auto space-y-8 leading-relaxed select-text ${
                fontFamily === 'serif' ? 'font-serif' : 'font-sans'
              }`}
              style={{ fontSize: `${fontSize}px` }}
            >
              {/* Publisher & Metadata */}
              <div className="space-y-3 font-sans border-b border-black/5 dark:border-white/5 pb-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-accent">
                  <span>{article.category}</span>
                  <span>•</span>
                  <span>{article.source}</span>
                  <span>•</span>
                  <span className="text-secondary">
                    ~{Math.max(1, Math.round((article.content?.split(/\s+/).length || 200) / 238))} min read
                  </span>
                  {/* Inline progress */}
                  {readPct > 0 && !completed && (
                    <span className="ml-auto text-secondary font-bold">{readPct}% read</span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight leading-tight">
                  {article.title}
                </h1>
                {article.publish_date && (
                  <p className="text-xs text-secondary font-medium">
                    Published: {new Date(article.publish_date).toLocaleDateString(undefined, {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Narrated content container */}
              <div className="space-y-6">
                {sentences.length > 0 ? (
                  sentences.map((sentence, idx) => (
                    <span 
                      key={idx} 
                      className={`inline-block ${
                        idx === currentSentenceIdx ? getHighlightClass() : 'transition-colors duration-200'
                      }`}
                    >
                      {sentence}{' '}
                    </span>
                  ))
                ) : (
                  <p>{article.content}</p>
                )}
              </div>

              {/* Bottom footer linking to original source */}
              <div className="pt-10 border-t border-black/5 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans text-xs pb-10">
                <span className="text-secondary font-medium">
                  Enjoyed this article? Supports original journalism.
                </span>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 border border-accent/25 hover:border-accent hover:bg-accent/5 rounded-xl font-bold uppercase tracking-wider text-accent transition-colors"
                >
                  Read on {article.source} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </article>
          ) : (
            <div className="text-center py-20 opacity-60 font-sans text-sm">
              Failed to display article content in reader mode.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
