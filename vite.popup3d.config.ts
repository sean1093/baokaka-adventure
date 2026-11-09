import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The three.js spike's build (#225): `popup3d.html` on its own, into the same `dist/` after the game
 * (`npm run build` runs both). Its own build, not a second input of the game's: a shared input
 * would split the modules both use into a common chunk and change the game's entry. Here the game's
 * files are untouched and the spike carries its own copy of what it uses.
 */
export default defineConfig({
  base: '/baokaka-adventure/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: { input: { popup3d: 'popup3d.html' } },
    // Bitmaps stay files (as the game's config): each is cached on its own
    assetsInlineLimit: (file) => (file.includes('/assets/sprites/') || file.includes('/assets/env/') || file.includes('/popup3d/assets/') ? false : undefined),
    chunkSizeWarningLimit: 1600,
  },
});
