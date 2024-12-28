import path from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import frappeui from 'frappe-ui/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [frappeui(), vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
build: {
  outDir: '/home/frappe-user/frappe-bench/sites/app.besty.nz/public/frontend',
  emptyOutDir: true,
  target: 'es2015',
},

  optimizeDeps: {
    include: ['frappe-ui > feather-icons', 'showdown', 'engine.io-client'],
  },
  base: '/frontend/', // Ensures assets use the correct base path
});


