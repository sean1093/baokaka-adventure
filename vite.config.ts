import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/baokaka-adventure/',
  plugins: [react()],
  // Character sprites (#94) and environment bitmaps (#96) stay files, never inlined as base64: each
  // is cached on its own and fetched only when a page draws it (D-56, D-59)
  build: { assetsInlineLimit: (file) => (file.includes('/assets/sprites/') || file.includes('/assets/env/') ? false : undefined) },
  // CSS is stubbed in tests, except the battle VFX and rig sheets, whose rules battleFx.test.ts and heroes.test.ts read (`?raw`)
  test: { include: ['src/**/*.test.ts'], css: { include: [/battleFx\.css/, /rig\.css/] } },
});
