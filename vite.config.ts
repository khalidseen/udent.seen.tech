import path from "path"
import reactSWC from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'
import { componentTagger } from "lovable-tagger"
import critical from 'rollup-plugin-critical'

// Plugin to add preload hints and resource hints for critical resources
const preloadCriticalPlugin = () => ({
  name: 'preload-critical',
  transformIndexHtml: {
    order: 'pre' as const,
    handler(html: string) {
      let preloadTags = '\n    <!-- Resource hints to reduce latency and break dependency chain -->';
      
      // Critical: Add dns-prefetch and preconnect for external origins
      preloadTags += '\n    <link rel="dns-prefetch" href="https://fonts.googleapis.com">';
      preloadTags += '\n    <link rel="dns-prefetch" href="https://fonts.gstatic.com">';
      preloadTags += '\n    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>';
      preloadTags += '\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
      
      // Add preconnect for Supabase if used
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        try {
          const domain = new URL(supabaseUrl).origin;
          preloadTags += `\n    <link rel="dns-prefetch" href="${domain}">`;
          preloadTags += `\n    <link rel="preconnect" href="${domain}" crossorigin>`;
        } catch (e) {
          console.warn('Invalid Supabase URL:', supabaseUrl);
        }
      }
      
      preloadTags += '\n    <!-- Preload critical resources to break dependency chain -->';
      
      // Extract and preload critical CSS with highest priority
      const cssMatches = html.match(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi) || [];
      cssMatches.forEach(tag => {
        const hrefMatch = tag.match(/href=["']([^"']+)["']/);
        if (hrefMatch && hrefMatch[1]) {
          // Use preload with fetchpriority="high" to break the dependency chain
          preloadTags += `\n    <link rel="preload" href="${hrefMatch[1]}" as="style" fetchpriority="high" crossorigin>`;
        }
      });
      
      // Extract and modulepreload main JS bundles with high priority
      const scriptMatches = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
      scriptMatches.forEach(tag => {
        const srcMatch = tag.match(/src=["']([^"']+)["']/);
        if (srcMatch && srcMatch[1]) {
          // Preload all JS chunks to reduce dependency chain
          // Use fetchpriority to ensure critical chunks load first
          if (srcMatch[1].includes('index-') || srcMatch[1].includes('react-')) {
            preloadTags += `\n    <link rel="modulepreload" href="${srcMatch[1]}" fetchpriority="high" crossorigin>`;
          } else {
            preloadTags += `\n    <link rel="modulepreload" href="${srcMatch[1]}" crossorigin>`;
          }
        }
      });
      
      // Insert hints immediately after <head> to ensure earliest possible processing
      return html.replace(/<head[^>]*>/, (match) => `${match}${preloadTags}`);
    }
  }
});

// Advanced CSS loading optimization
const deferCSSPlugin = () => ({
  name: 'defer-css',
  transformIndexHtml: {
    order: 'post' as const,
    handler(html: string) {
      let noscriptTags = '';
      
      const transformedHtml = html.replace(
        /<link([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
        (match, before, middle, href, after) => {
          // Skip critical CSS and external fonts
          if (match.includes('data-inline') || 
              match.includes('fonts.googleapis') || 
              match.includes('onload=')) {
            return match;
          }
          
          // Add noscript fallback for browsers without JS
          noscriptTags += `<noscript><link rel="stylesheet" href="${href}"></noscript>`;
          
          // Defer non-critical CSS with print media trick for faster initial render
          return `<link${before}rel="stylesheet"${middle}href="${href}"${after} media="print" onload="this.media='all';this.onload=null;">`;
        }
      );
      
      return transformedHtml.replace('</head>', `${noscriptTags}</head>`);
    }
  }
});

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  build: {
    minify: 'terser',
    target: 'es2020',
    cssCodeSplit: true,
    cssMinify: 'lightningcss',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 3, // More passes for better dead code elimination
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
        dead_code: true,
        unused: true,
        toplevel: true, // Aggressive tree-shaking
      },
      mangle: {
        safari10: true,
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Critical: React core - smallest possible bundle
          if (id.includes('react/jsx-runtime') || id.includes('react-dom/client')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react') && !id.includes('react-router') && !id.includes('react-hook')) {
            return 'react';
          }
          
          // Router - separate from react
          if (id.includes('react-router-dom')) {
            return 'router';
          }
          
          // Query - separate chunk
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          
          // Supabase - only load when needed
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // Split UI components by usage frequency
          // High frequency UI components
          if (id.includes('@radix-ui/react-dialog') || 
              id.includes('@radix-ui/react-dropdown-menu') ||
              id.includes('@radix-ui/react-toast')) {
            return 'ui-core';
          }
          
          // Low frequency UI components
          if (id.includes('@radix-ui')) {
            return 'ui-extended';
          }
          
          // Icons - separate chunk
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Charts - only load on reports/analytics pages
          if (id.includes('recharts') || id.includes('chart.js')) {
            return 'charts';
          }
          
          // Forms - only load on form pages
          if (id.includes('react-hook-form') || id.includes('zod')) {
            return 'forms';
          }
          
          // Utils - separate chunk
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils';
          }
          
          // 3D libraries - only load when needed
          if (id.includes('@react-three') || id.includes('three')) {
            return '3d-libs';
          }
          
          // Heavy dependencies
          if (id.includes('fabric') || id.includes('html2canvas') || id.includes('jspdf')) {
            return 'heavy-libs';
          }
          
          // AI/ML libraries
          if (id.includes('@huggingface')) {
            return 'ai-libs';
          }
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
        // Only preload absolutely critical chunks
        const criticalChunks = ['react-core', 'react', 'router'];
        const deferredChunks = ['charts', 'ui-extended', 'forms', '3d-libs', 'heavy-libs', 'ai-libs'];
        
        // Filter out heavy non-critical chunks from initial preload
        const filtered = deps.filter(dep => 
          !deferredChunks.some(chunk => dep.includes(chunk))
        );
        
        // Sort: critical first, then everything else
        return filtered
          .filter(dep => criticalChunks.some(chunk => dep.includes(chunk)))
          .concat(filtered.filter(dep => 
            !criticalChunks.some(chunk => dep.includes(chunk))
          ));
      },
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ],
    exclude: [
      '@node-rs/argon2', 
      '@node-rs/bcrypt',
      '@huggingface/transformers',
      'three',
      '@react-three/fiber',
      '@react-three/drei'
    ],
  },
  plugins: [
    reactSWC(),
    mode === 'development' && componentTagger(),
    mode === 'production' && preloadCriticalPlugin(),
    mode === 'production' && critical({
      inline: true,
      minify: true,
      extract: true, // Extract critical CSS to reduce main CSS size
      base: 'dist/',
      width: 1920,
      height: 1080,
      dimensions: [{
        width: 375,
        height: 667
      }, {
        width: 414,
        height: 896
      }, {
        width: 768,
        height: 1024
      }, {
        width: 1920,
        height: 1080
      }],
      ignore: {
        atrule: ['@font-face', '@keyframes'],
        decl: (node: any, value: any) => {
          // Aggressively ignore non-critical CSS
          return /url\(/.test(value) || /base64/.test(value);
        }
      },
      penthouse: {
        timeout: 180000,
        pageLoadSkipTimeout: 40000,
        renderWaitTime: 5000,
        blockJSRequests: false,
        // Minimal critical selectors - only what's absolutely needed for first paint
        forceInclude: [
          'html', 
          'body'
        ],
        strict: false,
        maxEmbeddedBase64Length: 500, // Reduced to minimize inline data
        keepLargerMediaQueries: false,
        propertiesToRemove: [
          '(.*)transition(.*)',
          '(.*)animation(.*)',
          'cursor',
          'pointer-events',
          'user-select',
          'outline',
          'box-shadow',
          '(.*)transform(.*)',
          'will-change',
          'perspective',
          'backface-visibility'
        ]
      }
    }),
    mode === 'production' && deferCSSPlugin(),
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
