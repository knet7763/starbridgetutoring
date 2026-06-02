import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * ErrorBoundary - Catches React component errors and displays a fallback UI
 * Prevents entire app crash if a component throws an error
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });

        // Log to external service in production
        if (import.meta.env.VITE_SENTRY_DSN) {
            this.logToSentry(error, errorInfo);
        }
    }

    logToSentry = (error, errorInfo) => {
        // Placeholder for Sentry integration
        // TODO: Integrate Sentry when available
        console.warn('Error logging not configured. Set up Sentry for production.');
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            const isDev = import.meta.env.DEV;

            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
                    <div className="max-w-md w-full">
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 backdrop-blur">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                                <h1 className="text-xl font-bold text-red-300">Something went wrong</h1>
                            </div>

                            <p className="text-gray-300 text-sm mb-4">
                                We encountered an unexpected error. Try refreshing the page or contact support if the problem persists.
                            </p>

                            {isDev && this.state.error && (
                                <details className="mb-4 text-xs text-gray-400 bg-black/40 rounded p-2 max-h-40 overflow-auto">
                                    <summary className="cursor-pointer font-mono text-red-300 mb-2">
                                        Error Details (Development)
                                    </summary>
                                    <pre className="whitespace-pre-wrap break-words font-mono">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded transition"
                                >
                                    Go Home
                                </button>
                                <button
                                    onClick={this.handleReset}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
