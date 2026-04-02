'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches React component errors and displays a fallback UI
 */
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error boundary caught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white border-2 border-black p-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                            <h2 className="text-2xl font-black uppercase tracking-tight">
                                Something Went Wrong
                            </h2>
                        </div>

                        <p className="text-sm text-secondary mb-6 leading-relaxed">
                            We encountered an unexpected error. This has been logged and we&apos;re working on it.
                            Please try refreshing the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-xs font-mono overflow-auto">
                                <p className="font-bold text-red-900 mb-2">Error Details:</p>
                                <p className="text-red-800">{this.state.error.toString()}</p>
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="w-full bg-black text-white px-6 py-3 font-black uppercase text-sm tracking-wider hover:bg-accent transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * API Error Display Component
 * Shows when API requests fail
 */
export function ApiErrorDisplay({
    error,
    onRetry,
}: {
    error?: string;
    onRetry?: () => void;
}) {
    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 my-4">
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-bold text-sm text-yellow-900 mb-2">
                        Connection Issue
                    </h3>
                    <p className="text-sm text-yellow-800 mb-3">
                        {error || 'Unable to connect to the server. Please check your connection and try again.'}
                    </p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="text-sm font-bold text-yellow-900 hover:text-yellow-700 underline"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Loading Fallback Component
 */
export function LoadingFallback({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-black border-t-accent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-bold uppercase tracking-wider text-secondary">
                    {message}
                </p>
            </div>
        </div>
    );
}
