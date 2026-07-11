'use client';
import { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../lib/config';
import { useReader } from '../contexts/ReaderContext';
import { Volume2, VolumeX, Activity, Radio, Sparkles } from 'lucide-react';
import type { Article } from '../app/page';

interface LiveEvent {
    id: number;
    title: string;
    source: string;
    category: string;
    timestamp: number;
    sentiment: number; // -1 to +1
}

// Procedural audio alert using Web Audio API (no external file dependencies)
function playNotificationChime() {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        
        // Crisp high-end newsroom wire chime (A5 chord overlay)
        const now = ctx.currentTime;
        
        // Root frequency
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(440, now + 0.3);
        gain1.gain.setValueAtTime(0.06, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        
        // Fifth (harmonic ring)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318.51, now); // E6
        gain2.gain.setValueAtTime(0.03, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc1.start(now);
        osc1.stop(now + 0.45);
        osc2.start(now);
        osc2.stop(now + 0.3);
    } catch {}
}

function computeSentiment(title: string): number {
    const positiveWords = ['breakthrough', 'win', 'wins', 'growth', 'succeed', 'positive', 'discovery', 'alliance', 'rise', 'rises', 'surges', 'boost', 'upgrade', 'optimism', 'high', 'peak', 'gain', 'gains', 'love', 'pulled', 'super', 'run', 'free', 'agent'];
    const negativeWords = ['fall', 'falls', 'drop', 'decline', 'loss', 'losses', 'crash', 'fail', 'failure', 'clash', 'dispute', 'scandal', 'protest', 'injure', 'injured', 'dead', 'death', 'kill', 'shut', 'drop', 'slump', 'warn', 'warns', 'risk', 'disaster', 'clash', 'police', 'block', 'snub'];
    
    let score = 0;
    const words = title.toLowerCase().split(/[^a-zA-Z]+/);
    for (const w of words) {
        if (positiveWords.includes(w)) score += 0.35;
        if (negativeWords.includes(w)) score -= 0.35;
    }
    return Math.max(-0.8, Math.min(0.8, score));
}

export default function LivePulseWidget() {
    const [events, setEvents] = useState<LiveEvent[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const { openReader } = useReader();
    const initialized = useRef(false);

    // Load initial 4 articles to seed the wire ticker
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        async function seedTicker() {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/articles?limit=4`);
                if (!res.ok) return;
                const data = await res.json();
                const items = data.articles || data || [];
                const seeded: LiveEvent[] = items.map((a: any) => ({
                    id: a.id,
                    title: a.title,
                    source: a.source,
                    category: a.category,
                    timestamp: new Date(a.publish_date).getTime(),
                    sentiment: computeSentiment(a.title)
                }));
                setEvents(seeded);
            } catch {}
        }
        seedTicker();
    }, []);

    // Subscribe to SSE stream for live updates
    useEffect(() => {
        const streamUrl = `${API_BASE_URL}/api/v1/articles/stream`;
        let es: EventSource;

        function connect() {
            es = new EventSource(streamUrl);
            es.onmessage = (event) => {
                try {
                    const article = JSON.parse(event.data);
                    const newEv: LiveEvent = {
                        id: article.id,
                        title: article.title,
                        source: article.source,
                        category: article.category,
                        timestamp: Date.now(),
                        sentiment: computeSentiment(article.title)
                    };
                    
                    setEvents(prev => {
                        // Avoid duplicates
                        if (prev.some(e => e.id === newEv.id)) return prev;
                        return [newEv, ...prev].slice(0, 8);
                    });

                    if (soundEnabled) {
                        playNotificationChime();
                    }
                } catch {}
            };
        }
        connect();
        return () => es?.close();
    }, [soundEnabled]);

    // Sentiment breakdown metrics
    const total = events.length;
    const pos = events.filter(e => e.sentiment > 0.1).length;
    const neg = events.filter(e => e.sentiment < -0.1).length;
    const neu = total - pos - neg;
    
    const posPct = total > 0 ? Math.round((pos / total) * 100) : 33;
    const negPct = total > 0 ? Math.round((neg / total) * 100) : 33;
    const neuPct = total > 0 ? 100 - posPct - negPct : 34;

    return (
        <section className="bg-card border-2 border-brand dark:border-border p-5 shadow-[4px_4px_0px_0px_var(--color-brand)] dark:shadow-[4px_4px_0px_0px_var(--color-border)] rounded-none">
            {/* Header / Title */}
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent animate-pulse" />
                    <h4 className="font-serif text-sm font-black tracking-wider uppercase">Live Newsroom Pulse</h4>
                </div>
                
                {/* Audio chime toggle */}
                <button
                    onClick={() => {
                        const next = !soundEnabled;
                        setSoundEnabled(next);
                        if (next) playNotificationChime();
                    }}
                    className={`p-1.5 border rounded-none transition-all flex items-center gap-1 text-[9px] font-mono font-bold uppercase cursor-pointer
                        ${soundEnabled
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'border-border text-secondary hover:text-primary hover:border-primary'
                        }`}
                    title={soundEnabled ? 'Chime active' : 'Enable audio chime'}
                >
                    {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>Chime</span>
                </button>
            </div>

            {/* Ingestion Stream Wire */}
            <div className="space-y-3 mb-5 max-h-56 overflow-y-auto no-scrollbar pr-1">
                {events.length === 0 ? (
                    <div className="text-center py-6 text-secondary text-xs font-mono">
                        <Radio className="w-6 h-6 mx-auto mb-2 animate-bounce opacity-45" />
                        Awaiting connection...
                    </div>
                ) : (
                    events.map((e, idx) => {
                        const isNew = idx === 0 && Date.now() - e.timestamp < 10000;
                        const sLabel = e.sentiment > 0.1 ? 'POS' : e.sentiment < -0.1 ? 'NEG' : 'NEU';
                        const sColor = e.sentiment > 0.1 
                            ? 'text-green-600 dark:text-green-400 bg-green-500/10' 
                            : e.sentiment < -0.1 
                            ? 'text-red-600 dark:text-red-400 bg-red-500/10' 
                            : 'text-secondary bg-muted';

                        return (
                            <div
                                key={e.id}
                                onClick={() => openReader(e.id)}
                                className={`group p-2.5 border border-border/60 hover:border-accent cursor-pointer transition-all relative flex flex-col gap-1.5
                                    ${isNew ? 'bg-accent/5 border-accent animate-pulse shadow-sm' : 'hover:bg-accent/2'}`}
                            >
                                <div className="flex items-center justify-between text-[8px] font-mono">
                                    <span className="font-black uppercase tracking-wider text-accent">{e.source}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`px-1 py-0.5 font-bold ${sColor}`}>{sLabel}</span>
                                        <span className="text-secondary">{new Date(e.timestamp).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                                    </div>
                                </div>
                                <p className="text-[11px] font-mono font-bold leading-snug group-hover:underline text-primary line-clamp-2">
                                    {e.title}
                                </p>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Sentiment Gauge Breakdown */}
            <div className="border-t border-border/60 pt-4">
                <div className="flex items-center gap-1 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest text-secondary">Sentiment Pulse</span>
                </div>
                
                {/* Visual Distribution Bar */}
                <div className="w-full h-2.5 bg-muted overflow-hidden flex mb-2 rounded-sm border border-border/40">
                    <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${posPct}%` }} title={`Positive: ${posPct}%`} />
                    <div className="h-full bg-border transition-all duration-500" style={{ width: `${neuPct}%` }} title={`Neutral: ${neuPct}%`} />
                    <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${negPct}%` }} title={`Negative: ${negPct}%`} />
                </div>
                
                {/* Distribution Labels */}
                <div className="flex justify-between text-[8px] font-mono text-secondary font-black">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />POS: {posPct}%</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-border" />NEU: {neuPct}%</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />NEG: {negPct}%</span>
                </div>
            </div>
        </section>
    );
}
