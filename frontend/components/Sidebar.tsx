'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Radio, ChevronRight, Newspaper, Zap, BarChart3 } from 'lucide-react';
import { API_ENDPOINTS } from '../lib/config';

interface Stats {
    total_articles: number;
    new_today: number;
    status: string;
}

interface Article {
    title: string;
    source: string;
    url: string;
    publish_date: string;
}

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [quickFeed, setQuickFeed] = useState<Article[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetch(API_ENDPOINTS.STATS)
                .then(res => res.json())
                .then(setStats)
                .catch(console.error);

            fetch(API_ENDPOINTS.QUICK_FEED)
                .then(res => res.json())
                .then(setQuickFeed)
                .catch(console.error);
        }
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <aside className={`fixed top-0 left-0 h-full w-[350px] bg-white z-[70] shadow-2xl transition-transform duration-500 ease-in-out border-r-2 border-black ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full uppercase tracking-widest font-black">
                    {/* Header */}
                    <div className="p-6 border-b-2 border-black flex justify-between items-center bg-paper">
                        <span className="text-[11px]">Newsroom Command</span>
                        <button onClick={onClose} className="p-2 hover:bg-black hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-12">
                        {/* 1. Live Ingestion Stats */}
                        <section>
                            <h3 className="text-[10px] text-accent flex items-center gap-2 mb-6">
                                <Radio className="w-3 h-3 animate-pulse" /> 🛰️ Live Ingestion Stats
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted border border-border flex flex-col gap-1">
                                    <span className="text-[9px] text-secondary">Total Processed</span>
                                    <span className="text-2xl font-serif tracking-tighter">{stats?.total_articles || '---'}</span>
                                </div>
                                <div className="p-4 bg-muted border border-border flex flex-col gap-1">
                                    <span className="text-[9px] text-secondary">New Today</span>
                                    <span className="text-2xl font-serif tracking-tighter text-accent">+{stats?.new_today || '---'}</span>
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-[9px] text-secondary">
                                <Zap className="w-3 h-3 text-yellow-500" /> System Status: <span className="text-black">{stats?.status || 'Syncing...'}</span>
                            </div>
                        </section>

                        {/* 3. Extended Sections */}
                        <section>
                            <h3 className="text-[10px] flex items-center gap-2 mb-6 border-b border-black pb-2">
                                <Newspaper className="w-3 h-3" /> Extended Sections
                            </h3>
                            <div className="flex flex-col gap-4">
                                {[
                                    { name: 'AI & Startups', path: 'AI & Startups' },
                                    { name: 'Environment', path: 'Environment' },
                                    { name: 'Education', path: 'Education' },
                                    { name: 'World', path: 'World' },
                                ].map(section => (
                                    <Link
                                        key={section.name}
                                        href={`/?category=${section.path}`}
                                        onClick={onClose}
                                        className="group flex items-center justify-between text-[13px] hover:text-accent transition-colors"
                                    >
                                        {section.name}
                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                ))}
                            </div>
                        </section>

                        {/* 4. Quick-Feed */}
                        <section>
                            <h3 className="text-[10px] flex items-center gap-2 mb-6 border-b border-black pb-2">
                                <BarChart3 className="w-3 h-3" /> The Quick-Feed (Latest 10)
                            </h3>
                            <div className="flex flex-col gap-6">
                                {quickFeed.map((art, i) => (
                                    <a
                                        key={i}
                                        href={art.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group block"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[8px] px-1 bg-black text-white">{art.source}</span>
                                            <span className="text-[8px] text-secondary">{new Date(art.publish_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <h4 className="text-[11px] leading-tight font-bold group-hover:text-accent lowercase normal-case">
                                            {art.title}
                                        </h4>
                                    </a>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border text-[9px] text-secondary text-center">
                        The Smart News Engine v2.1 • 2026 Ready
                    </div>
                </div>
            </aside>
        </>
    );
}
