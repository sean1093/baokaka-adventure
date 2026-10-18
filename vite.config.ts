import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/baokaka-adventure/',
  plugins: [react()],
  // CSS is stubbed in tests, except the battle VFX and rig sheets, whose rules battleFx.test.ts and heroes.test.ts read (`?raw`)
  test: { include: ['src/**/*.test.ts'], css: { include: [/battleFx\.css/, /rig\.css/] } },
});
