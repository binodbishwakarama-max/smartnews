'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getScraperStatus, triggerScraping, cleanupOldArticles, ScraperStatus } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, RefreshCw, Trash2, BarChart3, Clock, Database, Sparkles, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';

const SourceProgress = ({ name, count, total }: { name: string; count: number; total: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-secondary">{name}</span>
                <span className="text-primary">{count} ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-accent to-gold rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default function AdminDashboard() {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const [status, setStatus] = useState<ScraperStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [scraping, setScraping] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [maxArticles, setMaxArticles] = useState(50);
    const [cleanupDays, setCleanupDays] = useState(30);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push('/');
            return;
        }

        if (isSignedIn) {
            loadStatus();
        }
    }, [isLoaded, isSignedIn, router]);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const data = await getScraperStatus();
            setStatus(data);
            setError('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load scraper status');
            console.error('Error loading status:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerScraping = async () => {
        try {
            setScraping(true);
            setError('');
            const response = await triggerScraping(maxArticles);
            setMessage(response.message);
            // Reload status after a short delay
            setTimeout(loadStatus, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to trigger scraping');
            console.error('Error triggering scraping:', err);
        } finally {
            setScraping(false);
        }
    };

    const handleCleanup = async () => {
        try {
            setCleaning(true);
            setError('');
            const response = await cleanupOldArticles(cleanupDays);
            setMessage(response.message);
            // Reload status after cleanup
            setTimeout(loadStatus, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cleanup old articles');
            console.error('Error cleaning up:', err);
        } finally {
            setCleaning(false);
        }
    };

    if (!isLoaded || !isSignedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-accent" />
                    <span className="text-xs font-black uppercase tracking-widest text-secondary">Securing Session...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-primary selection:bg-accent selection:text-white transition-colors duration-300 relative overflow-hidden">
            {/* Glowing background blob */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 dark:bg-accent/3 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-gold/5 dark:bg-gold/3 blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 py-12 relative">
                
                {/* Heading Block */}
                <div className="mb-12 border-b-2 border-brand pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.2em] text-accent mb-2">
                            <Activity className="w-4 h-4 animate-pulse" />
                            System Administration
                        </span>
                        <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tighter uppercase">
                            Admin Dashboard
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-secondary max-w-sm">
                        Welcome back, <strong className="text-primary font-black">{user?.firstName || user?.username || 'Admin'}</strong>. Monitor system health, adjust scraper settings, and review curated categories.
                    </p>
                </div>

                {(message || error) && (
                    <Alert className={`mb-8 border-2 rounded-2xl ${
                        error 
                            ? 'border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400' 
                            : 'border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400'
                    }`}>
                        <div className="flex gap-2 items-center">
                            {error ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            <AlertDescription className="font-bold text-sm">
                                {error || message}
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    
                    {/* Scraper Status */}
                    <Card className="rounded-2xl border border-border/80 dark:border-border/30 bg-card/40 dark:bg-paper/45 backdrop-blur-md shadow-lg overflow-hidden">
                        <CardHeader className="border-b border-border/40 pb-6">
                            <CardTitle className="flex items-center gap-2 font-serif text-2xl font-black">
                                <BarChart3 className="h-5 w-5 text-accent" />
                                Scraper Status
                            </CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-secondary">
                                Current scraping statistics and system health
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Retrieving Analytics...</span>
                                </div>
                            ) : status ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="text-center p-6 bg-card dark:bg-paper border border-border/80 dark:border-border/30 rounded-2xl shadow-sm hover:shadow transition-shadow">
                                            <Database className="h-8 w-8 mx-auto mb-2 text-accent" />
                                            <div className="text-3xl font-serif font-black text-primary mb-1">
                                                {status.total_articles.toLocaleString()}
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-widest text-secondary">
                                                Total Articles
                                            </div>
                                        </div>
                                        <div className="text-center p-6 bg-card dark:bg-paper border border-border/80 dark:border-border/30 rounded-2xl shadow-sm hover:shadow transition-shadow">
                                            <Clock className="h-8 w-8 mx-auto mb-2 text-gold" />
                                            <div className="text-3xl font-serif font-black text-primary mb-1">
                                                {status.recent_articles_24h}
                                            </div>
                                            <div className="text-xs font-black uppercase tracking-widest text-secondary">
                                                Last 24 Hours
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-secondary border-b border-border/40 pb-2 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-accent" />
                                            News Sources Distribution
                                        </h4>
                                        <div className="space-y-4">
                                            {Object.entries(status.sources).map(([source, count]) => (
                                                <SourceProgress 
                                                    key={source} 
                                                    name={source} 
                                                    count={count} 
                                                    total={status.total_articles} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                                    <ShieldAlert className="w-8 h-8 mx-auto text-secondary mb-2" />
                                    <p className="text-xs font-black uppercase tracking-widest text-secondary">Unable to load status</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Scraper Controls */}
                    <Card className="rounded-2xl border border-border/80 dark:border-border/30 bg-card/40 dark:bg-paper/45 backdrop-blur-md shadow-lg overflow-hidden">
                        <CardHeader className="border-b border-border/40 pb-6">
                            <CardTitle className="font-serif text-2xl font-black">Scraper Controls</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-secondary">
                                Manually trigger scraping and maintenance tasks
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-8">
                            
                            {/* Trigger Scraping */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="maxArticles" className="text-xs font-black uppercase tracking-wider text-secondary">Max Articles to Scrape</Label>
                                    <span className="text-xs font-bold text-accent bg-accent/5 px-2 py-0.5 rounded-full">{maxArticles} Articles</span>
                                </div>
                                <Input
                                    id="maxArticles"
                                    type="number"
                                    min="1"
                                    max="200"
                                    value={maxArticles}
                                    onChange={(e) => setMaxArticles(parseInt(e.target.value) || 50)}
                                    className="rounded-xl border-border bg-card dark:bg-paper focus:ring-accent"
                                />
                                <Button
                                    onClick={handleTriggerScraping}
                                    disabled={scraping}
                                    className="w-full bg-gradient-to-r from-accent to-red-700 hover:from-accent hover:to-red-800 text-white font-black uppercase tracking-widest text-xs py-5 rounded-xl shadow-lg transition-transform active:scale-98"
                                >
                                    {scraping ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Scraping in progress...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Trigger Live Scraping
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Cleanup */}
                            <div className="space-y-4 pt-6 border-t border-border/40">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="cleanupDays" className="text-xs font-black uppercase tracking-wider text-secondary">Cleanup Articles Older Than</Label>
                                    <span className="text-xs font-bold text-destructive bg-destructive/5 px-2 py-0.5 rounded-full">{cleanupDays} Days</span>
                                </div>
                                <Input
                                    id="cleanupDays"
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={cleanupDays}
                                    onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
                                    className="rounded-xl border-border bg-card dark:bg-paper focus:ring-destructive"
                                />
                                <Button
                                    onClick={handleCleanup}
                                    disabled={cleaning}
                                    variant="destructive"
                                    className="w-full bg-gradient-to-r from-destructive to-red-950 hover:from-destructive hover:to-red-900 text-white font-black uppercase tracking-widest text-xs py-5 rounded-xl shadow-lg transition-transform active:scale-98"
                                >
                                    {cleaning ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Running Cleanup...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Cleanup Database
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Refresh Status */}
                            <Button
                                onClick={loadStatus}
                                disabled={loading}
                                variant="outline"
                                className="w-full border-2 border-border hover:bg-muted font-black uppercase tracking-widest text-xs py-5 rounded-xl transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Refreshing statistics...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh Analytics
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Categories Overview */}
                {status && Object.keys(status.categories).length > 0 && (
                    <Card className="rounded-2xl border border-border/80 dark:border-border/30 bg-card/40 dark:bg-paper/45 backdrop-blur-md shadow-lg overflow-hidden">
                        <CardHeader className="border-b border-border/40 pb-6">
                            <CardTitle className="font-serif text-2xl font-black">Categories Analytics</CardTitle>
                            <CardDescription className="text-xs font-bold uppercase tracking-wider text-secondary">
                                Curated article distribution by topic category
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {Object.entries(status.categories).map(([category, count]) => (
                                    <div key={category} className="group relative text-center p-6 bg-card dark:bg-paper border border-border/80 dark:border-border/30 rounded-2xl hover:border-accent/40 dark:hover:border-accent/40 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="text-3xl font-serif font-black text-primary mb-1">
                                            {count}
                                        </div>
                                        <div className="text-xs font-black uppercase tracking-widest text-secondary group-hover:text-accent transition-colors">
                                            {category}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
