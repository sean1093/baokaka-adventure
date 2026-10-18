import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/baokaka-adventure/',
  plugins: [react()],
  // CSS is stubbed in tests, except the battle VFX sheet, whose limits battleFx.test.ts reads (`?raw`)
  test: { include: ['src/**/*.test.ts'], css: { include: [/battleFx\.css/] } },
});
