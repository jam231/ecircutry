import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative base works identically in local dev and on GitHub Pages (/ecircutry/)
export default defineConfig({
  base: './',
  plugins: [react()],
});
