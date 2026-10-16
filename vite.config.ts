import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, './package.json'), 'utf-8')
);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest', // 1. Switches to custom Service Worker building mode
      srcDir: 'src',                // 2. Looks for your custom source code inside src/
      filename: 'firebase-messaging-sw.js', // 3. Compiles src/firebase-messaging-sw.js
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Laundry Planner',
        short_name: 'LaundryApp',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  test: {
    globals: true, 
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    alias: {
      'react-native-localize': resolve(__dirname, './src/__mocks__/react-native-localize.ts'),
    },
  },
});
