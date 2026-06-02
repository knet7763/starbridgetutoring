import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['livekit-client', 'livekit-react', 'jotai', 'jotai/utils']
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          livekit: ['livekit-client', 'livekit-react'],
          tldraw: ['tldraw']
        }
      }
    }
  }
})
