import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { copyFileSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const isDevBuild = mode === 'development';

  return {
    plugins: [
      react(),
      {
        name: 'copy-manifest',
        writeBundle() {
          // Copy manifest.json to the dist directory
          copyFileSync(resolve(__dirname, 'manifest.json'), resolve(__dirname, 'dist/manifest.json'));
          console.log('manifest.json copied to dist directory');
        },
      },
    ],
    build: {
      outDir: 'dist',
      minify: !isDevBuild, // Disable minification for dev builds
      sourcemap: isDevBuild, // Enable source maps for dev builds
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup.tsx'),
          content: resolve(__dirname, 'src/content.tsx'),
          background: resolve(__dirname, 'src/background.ts'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  };
});