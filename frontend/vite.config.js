import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, '../backend/public'),
    emptyOutDir: true,
    // Split the single 1 MB bundle into parallel-cacheable chunks.
    // This was the #1 Lighthouse finding (TBT 0.13, bootup-time 0):
    // one monolithic JS file blocking the main thread on first paint.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'charts'
            if (id.includes('gsap') || id.includes('lenis')) return 'motion'
            if (id.includes('react') || id.includes('scheduler')) return 'vendor'
            return 'lib'
          }
        },
      },
    },
  },
  server: {
    // Dev proxy: same-origin API calls in development (no CORS pain).
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
