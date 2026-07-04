import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from "@sentry/react"
import App from './App.jsx'
import './index.css'

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)

// Register Service Worker for PWA / Low-Bandwidth Caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const swPath = `/sw.js?supabaseUrl=${encodeURIComponent(supabaseUrl)}`;
        navigator.serviceWorker.register(swPath)
            .then(reg => console.log('[Service Worker] Registered scope:', reg.scope))
            .catch(err => console.error('[Service Worker] Registration failed:', err));
    });
}
