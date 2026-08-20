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

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Laundry Planner',
        short_name: 'LaundryApp',
        theme_color: '#121212',       // System status bar color defaults
        background_color: '#121212',  // Splash screen background color
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
    // Inject ONLY the version string into the app
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  test: {
    // Enable global API like 'describe', 'test', and 'expect' without importing them
    globals: true, 
    // Simulate a browser environment in the terminal
    environment: 'jsdom',
    // Path to the setup file executed before running tests
    setupFiles: './src/setupTests.js',
    alias: {
      // Redirects the bundler to an absolute path to avoid resolving mobile source files
      'react-native-localize': resolve(__dirname, './src/__mocks__/react-native-localize.ts'),
    },
  },
});
