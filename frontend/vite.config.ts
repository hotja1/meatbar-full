import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'

/* Vite config Мясо Бар.
 *
 * Phase 9.D — pre-compression артефактов на диск:
 *   - gzip для старых клиентов / fallback
 *   - brotli для новых браузеров
 * Преобразование делается на этапе build, поэтому раздаче ничего
 * считать в рантайме не нужно — статический сервер (бэкенд Express
 * или CDN) отдаёт уже сжатые .br/.gz файлы вместе с заголовком
 * Content-Encoding.
 *
 * Code-split: ленивые чанки уже сделаны через React.lazy() в HomePage
 * (CartDrawer, TableMap). Дополнительные splits описаны в
 * `manualChunks` ниже — отделяем react-vendor от приложения, чтобы
 * пользователи получали один и тот же react-bundle через долгий
 * cache, даже если меняется код приложения.
 */
export default defineConfig({
  plugins: [
    react(),
    compression({
      include: [/\.(js|mjs|cjs|css|html|svg|json|webmanifest)$/i],
      algorithms: ['gzip'],
      threshold: 1024,
      deleteOriginalAssets: false,
    }),
    compression({
      include: [/\.(js|mjs|cjs|css|html|svg|json|webmanifest)$/i],
      algorithms: ['brotliCompress'],
      threshold: 1024,
      deleteOriginalAssets: false,
    }),
  ],
  build: {
    target: 'es2019',
    /* Source-maps включаем как отдельный файл — production-stack
       с web-vitals RUM имеет смысл расшифровывать ошибки. */
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],
          'router-vendor': ['react-router'],
          'icons-vendor': ['lucide-react'],
        },
      },
    },
    cssCodeSplit: true,
    /* Browser cache: длинные хеши в filename — стандартное
       поведение Vite, ничего отдельно настраивать не нужно. */
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
})
