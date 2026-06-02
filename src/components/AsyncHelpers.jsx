import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * AsyncComponentFallback - Loading/error fallback for lazy-loaded components
 * Used with React.Suspense and error boundaries
 */
export const AsyncComponentFallback = () => (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-yellow-400 text-xs font-black tracking-widest uppercase animate-pulse">
            Loading...
        </p>
    </div>
);

/**
 * APIErrorDisplay - Reusable component to display API errors to users
 * Props:
 *   - error: Error object or error message string
 *   - onRetry: Optional callback function for retry button
 *   - title: Optional custom error title
 */
export const APIErrorDisplay = ({ error, onRetry, title = 'Error Loading Data' }) => {
    const errorMessage = error?.message || error || 'An unexpected error occurred. Please try again.';

    return (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 backdrop-blur max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <h3 className="text-sm font-bold text-red-300">{title}</h3>
            </div>
            <p className="text-gray-300 text-xs mb-3 leading-relaxed">{errorMessage}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-3 rounded text-xs flex items-center justify-center gap-2 transition"
                >
                    <RefreshCw className="w-3 h-3" />
                    Try Again
                </button>
            )}
        </div>
    );
};

export default { AsyncComponentFallback, APIErrorDisplay };
