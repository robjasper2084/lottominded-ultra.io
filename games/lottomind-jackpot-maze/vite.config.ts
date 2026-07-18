import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const phaserSpectorStub = decodeURIComponent(new URL('./src/game/phaser3spectorjs-stub.ts', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');

export default defineConfig({
  // Keep production assets relative so the same build works on localhost and
  // under the GitHub Pages repository prefix.
  base: './',
  define: {
    FEATURE_SOUND: 'undefined',
    global: 'globalThis',
    PLUGIN_CAMERA3D: 'undefined',
    PLUGIN_FBINSTANT: 'undefined',
    WEBGL_DEBUG: 'undefined'
  },
  resolve: {
    alias: {
      phaser3spectorjs: phaserSpectorStub
    }
  },
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
        orientation: 'any',
        icons: [
          { src: 'assets/ui/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/ui/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,mp3}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /\.(?:mp4|mp3)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'jackpot-maze-media-v1',
              expiration: { maxEntries: 12, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'phaser-engine',
              test: /[\\/]node_modules[\\/]phaser[\\/]src[\\/]/,
              minSize: 20000,
              maxSize: 240000,
              priority: 30
            },
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              minSize: 20000,
              maxSize: 240000,
              priority: 20
            },
            {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              minSize: 20000,
              maxSize: 240000,
              priority: 10
            }
          ]
        }
      }
    }
  },
  test: { environment: 'node', include: ['src/tests/**/*.test.ts'] }
});
