import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  worker: {
    format: 'es',
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
})
