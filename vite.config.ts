import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['three'],
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      'three/examples/jsm': 'three/examples/jsm', // helps prevent deep import errors
    }
  },
});