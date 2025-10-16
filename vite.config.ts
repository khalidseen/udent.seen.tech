import path from "path"
import reactSWC from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'
import { componentTagger } from "lovable-tagger"
import critical from 'rollup-plugin-critical'

// Plugin to defer CSS loading to eliminate render-blocking
const deferCSSPlugin = () => ({
  name: 'defer-css',
  transformIndexHtml(html: string) {
    // Transform CSS link tags to use media="print" technique for deferred loading
    let noscriptTags = '';
    const transformedHtml = html.replace(
      /<link([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
      (match, before, middle, href, after) => {
        // Skip if already has onload or is a font stylesheet
        if (match.includes('onload=') || match.includes('fonts.googleapis')) {
          return match;
        }
        // Collect noscript fallback
        noscriptTags += `<noscript><link rel="stylesheet" href="${href}"></noscript>`;
        // Add defer loading attributes
        return `<link${before}rel="stylesheet"${middle}href="${href}"${after} media="print" onload="this.media='all';this.onload=null;">`;
      }
    );
    // Insert noscript tags before closing head tag
    return transformedHtml.replace('</head>', `${noscriptTags}</head>`);
  },
});

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  build: {
    minify: 'terser',
    target: 'esnext',
    cssCodeSplit: true, // Split CSS for better tree-shaking
    cssMinify: 'lightningcss', // Use faster CSS minifier
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Critical: React must be in its own chunk and loaded first
          'react': ['react', 'react-dom', 'react/jsx-runtime'],
          'router': ['react-router-dom'],
          'query': ['@tanstack/react-query'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'icons': ['lucide-react'],
          'charts': ['recharts'],
          'forms': ['react-hook-form', 'zod'],
          'utils': ['date-fns'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    reportCompressedSize: false,
    assetsInlineLimit: 8192, // Inline assets smaller than 8kb to reduce requests
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps) => {
        // Preload critical chunks first
        const criticalChunks = ['react', 'router', 'query'];
        return deps.filter(dep => 
          criticalChunks.some(chunk => dep.includes(chunk))
        ).concat(deps.filter(dep => 
          !criticalChunks.some(chunk => dep.includes(chunk))
        ));
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    exclude: ['@node-rs/argon2', '@node-rs/bcrypt'],
  },
  plugins: [
    reactSWC(),
    mode === 'development' && componentTagger(),
    mode === 'production' && deferCSSPlugin(),
    mode === 'production' && critical({
      inline: true,
      minify: true,
      dimensions: [{
        width: 375,
        height: 667
      }, {
        width: 1920,
        height: 1080
      }]
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        globIgnores: ['**/*.wasm', '**/ort-wasm*'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
          {
            urlPattern: /\.wasm$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'wasm-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /\/assets\/.+\.(js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year (immutable hashed assets)
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Udent Dental Management',
        short_name: 'Udent',
        description: 'A modern dental clinic management system.',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
