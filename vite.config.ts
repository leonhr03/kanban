import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Die App läuft unter /kanban/ (GitHub Pages: leonhr03.github.io/kanban/, bzw. eigener Server).
// Navigation läuft über den URL-Hash (#/PROJEKT), daher braucht es keine Kopien der index.html pro Route.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kanban/' : '/',
  plugins: [react(), tailwindcss()],
}))
