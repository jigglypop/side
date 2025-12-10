import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  build: {
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
})
