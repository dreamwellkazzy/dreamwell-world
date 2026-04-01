import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@world': path.resolve(__dirname, './src/world'),
      '@characters': path.resolve(__dirname, './src/characters'),
      '@physics': path.resolve(__dirname, './src/physics'),
      '@controls': path.resolve(__dirname, './src/controls'),
      '@audio': path.resolve(__dirname, './src/audio'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@data': path.resolve(__dirname, './src/data'),
      '@shaders': path.resolve(__dirname, './src/shaders'),
      '@rendering': path.resolve(__dirname, './src/rendering'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
  worker: {
    format: 'es',
  },
  server: {
    port: 3000,
  },
});
