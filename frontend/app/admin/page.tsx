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
import { Loader2, RefreshCw, Trash2, BarChart3, Clock, Database } from 'lucide-react';

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
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Welcome back, {user?.firstName || user?.username || 'Admin'}! Manage your news scraper and monitor system status.
                    </p>
                </div>

                {(message || error) && (
                    <Alert className={`mb-6 ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-green-500 bg-green-50 dark:bg-green-900/20'}`}>
                        <AlertDescription>
                            {error || message}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Scraper Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Scraper Status
                            </CardTitle>
                            <CardDescription>
                                Current scraping statistics and system health
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : status ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                            <div className="text-2xl font-bold text-blue-600">
                                                {status.total_articles.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Total Articles
                                            </div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                            <div className="text-2xl font-bold text-green-600">
                                                {status.recent_articles_24h}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                Last 24h
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Sources</h4>
                                        <div className="space-y-1">
                                            {Object.entries(status.sources).map(([source, count]) => (
                                                <div key={source} className="flex justify-between text-sm">
                                                    <span>{source}</span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">Unable to load status</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Scraper Controls */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Scraper Controls</CardTitle>
                            <CardDescription>
                                Manually trigger scraping and maintenance tasks
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Trigger Scraping */}
                            <div className="space-y-2">
                                <Label htmlFor="maxArticles">Max Articles to Scrape</Label>
                                <Input
                                    id="maxArticles"
                                    type="number"
                                    min="1"
                                    max="200"
                                    value={maxArticles}
                                    onChange={(e) => setMaxArticles(parseInt(e.target.value) || 50)}
                                />
                                <Button
                                    onClick={handleTriggerScraping}
                                    disabled={scraping}
                                    className="w-full"
                                >
                                    {scraping ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Scraping...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Trigger Scraping
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Cleanup */}
                            <div className="space-y-2">
                                <Label htmlFor="cleanupDays">Cleanup Articles Older Than (Days)</Label>
                                <Input
                                    id="cleanupDays"
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={cleanupDays}
                                    onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
                                />
                                <Button
                                    onClick={handleCleanup}
                                    disabled={cleaning}
                                    variant="destructive"
                                    className="w-full"
                                >
                                    {cleaning ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Cleaning...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Cleanup Old Articles
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Refresh Status */}
                            <Button
                                onClick={loadStatus}
                                disabled={loading}
                                variant="outline"
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Refresh Status
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Categories Overview */}
                {status && Object.keys(status.categories).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Categories Overview</CardTitle>
                            <CardDescription>
                                Article distribution by category
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(status.categories).map(([category, count]) => (
                                    <div key={category} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                                            {count}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
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
