import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../wallpaper-ui',
    emptyOutDir: false
  },
  server: {
    port: 5173
  }
})
