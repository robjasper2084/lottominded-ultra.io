import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Keep production assets relative so the same build works on localhost and
  // under the GitHub Pages repository prefix.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/ui/icon-192.png', 'assets/ui/icon-512.png'],
      manifest: {
        name: 'LottoMind: Jackpot Maze',
        short_name: 'Jackpot Maze',
        description: 'An original LottoMind neon maze-chase arcade game.',
        theme_color: '#090611',
        background_color: '#050309',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: 'assets/ui/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/ui/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],
  test: { environment: 'node', include: ['src/tests/**/*.test.ts'] }
});
