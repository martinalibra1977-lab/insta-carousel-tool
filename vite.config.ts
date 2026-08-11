import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Serves the app from https://<user>.github.io/insta-carousel-tool/ —
  // must match the repo name since this isn't a <user>.github.io root repo.
  base: '/insta-carousel-tool/',
  plugins: [react()],
})
