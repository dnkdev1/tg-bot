import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths ("./assets/…"), so the build works under any sub-path,
  // e.g. GitHub Pages serves it at https://dnkdev1.github.io/tg-bot/.
  // Routing uses the URL hash (#/chat/2), so no server rewrites are needed.
  base: './',
})
