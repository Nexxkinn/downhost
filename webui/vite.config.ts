import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { resolve } from 'path';

const root = resolve(__dirname,'src');
const outDir = resolve(__dirname,'dist');

export default defineConfig({
  root,
  plugins: [solidPlugin()],
  base:'',
  build: {
    outDir,
    emptyOutDir: 'true',
    rollupOptions: {
        input: {
          home: resolve(root,'home.html'),
          login: resolve(root,'login.html'),
          gallery: resolve(root,'gallery.html'),
          reader: resolve(root,'reader.html')
        }
    },
    target: 'esnext',
    polyfillDynamicImport: false,
  },
});
