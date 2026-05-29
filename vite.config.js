import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@daily-co/daily-js', 'jotai', 'jotai/utils']
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          daily: ['@daily-co/daily-js', '@daily-co/daily-react'],
          tldraw: ['tldraw']
        }
      }
    }
  }
})
