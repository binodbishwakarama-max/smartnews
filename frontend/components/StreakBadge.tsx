'use client';
import { useEffect, useRef, useState } from 'react';
import { useReadingHistory } from '../contexts/ReadingHistoryContext';
import { Flame, Trophy, Zap } from 'lucide-react';

// Milestone thresholds that trigger confetti
const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

// Mini confetti burst — pure CSS/JS, no library needed
function spawnConfetti(x: number, y: number) {
    const colors = ['#c22026', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f97316'];
    for (let i = 0; i < 28; i++) {
        const el = document.createElement('div');
        const size = Math.random() * 8 + 4;
        const angle = Math.random() * 360;
        const distance = Math.random() * 120 + 60;
        const tx = Math.cos((angle * Math.PI) / 180) * distance;
        const ty = Math.sin((angle * Math.PI) / 180) * distance - 60;
        el.style.cssText = `
            position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;
            background:${colors[Math.floor(Math.random() * colors.length)]};
            border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
            pointer-events:none;z-index:9999;
            transform:translate(-50%,-50%);
            transition:transform 0.7s cubic-bezier(.17,.67,.83,.67), opacity 0.7s ease;
        `;
        document.body.appendChild(el);
        requestAnimationFrame(() => {
            el.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${angle * 2}deg)`;
            el.style.opacity = '0';
        });
        setTimeout(() => el.remove(), 750);
    }
}

export default function StreakBadge() {
    const { streak, todayCount, totalRead } = useReadingHistory();
    const [showTooltip, setShowTooltip] = useState(false);
    const [celebrated, setCelebrated] = useState<number>(0);
    const badgeRef = useRef<HTMLButtonElement>(null);
    const prevStreakRef = useRef<number>(0);

    // Trigger confetti when hitting a milestone
    useEffect(() => {
        const curr = streak.current;
        if (curr > prevStreakRef.current && MILESTONES.includes(curr) && curr !== celebrated) {
            setCelebrated(curr);
            const rect = badgeRef.current?.getBoundingClientRect();
            if (rect) {
                spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
            }
        }
        prevStreakRef.current = curr;
    }, [streak.current]);

    const isMilestone = MILESTONES.includes(streak.current);
    const isHot = streak.current >= 7;

    if (!streak.todayRead && streak.current === 0) {
        // Show a subtle "Start your streak" prompt before first ever read
        return (
            <button
                ref={badgeRef}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono font-black uppercase tracking-widest text-secondary/70 hover:text-accent border border-dashed border-border hover:border-accent transition-all duration-200 rounded-none group"
                onClick={() => setShowTooltip(!showTooltip)}
                title="Start your reading streak"
            >
                <Flame className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-orange-500 transition-all" />
                Start Streak
            </button>
        );
    }

    return (
        <div className="relative hidden md:block">
            <button
                ref={badgeRef}
                onClick={() => setShowTooltip(!showTooltip)}
                onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-black uppercase tracking-wider rounded-none border transition-all duration-200 cursor-pointer select-none
                    ${isMilestone
                        ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.4)] animate-pulse'
                        : isHot
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20'
                        : 'bg-accent/8 text-accent border-accent/25 hover:bg-accent/15'
                    }`}
            >
                {isHot
                    ? <Flame className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
                    : <Zap className="w-3.5 h-3.5" />
                }
                <span>{streak.current}d</span>
                {isMilestone && <Trophy className="w-3 h-3 text-yellow-300" />}
            </button>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-card border-2 border-brand dark:border-border shadow-[4px_4px_0px_0px_var(--color-brand)] dark:shadow-[4px_4px_0px_0px_var(--color-border)] p-4 z-50 rounded-none">
                    <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-serif font-black">Reading Streak</span>
                    </div>
                    <div className="space-y-2 text-[10px] font-mono">
                        <div className="flex justify-between">
                            <span className="text-secondary uppercase tracking-wider">Current</span>
                            <span className="font-black text-primary">{streak.current} day{streak.current !== 1 ? 's' : ''} 🔥</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary uppercase tracking-wider">Best</span>
                            <span className="font-black text-gold">{streak.longest} days</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary uppercase tracking-wider">Today</span>
                            <span className="font-black">{todayCount} article{todayCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary uppercase tracking-wider">All Time</span>
                            <span className="font-black">{totalRead} read</span>
                        </div>
                        {!streak.todayRead && streak.current > 0 && (
                            <div className="mt-3 pt-2 border-t border-border text-accent font-black text-center animate-pulse">
                                ⚡ Read today to keep your streak!
                            </div>
                        )}
                        {isMilestone && (
                            <div className="mt-3 pt-2 border-t border-border text-orange-500 font-black text-center">
                                🏆 Milestone reached!
                            </div>
                        )}
                    </div>
                    {/* Progress to next milestone */}
                    {(() => {
                        const next = MILESTONES.find(m => m > streak.current);
                        if (!next) return null;
                        const prev = MILESTONES.filter(m => m <= streak.current).pop() || 0;
                        const pct = ((streak.current - prev) / (next - prev)) * 100;
                        return (
                            <div className="mt-3">
                                <div className="flex justify-between text-[9px] font-mono text-secondary mb-1">
                                    <span>Next milestone</span>
                                    <span>{next}d</span>
                                </div>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
