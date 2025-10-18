import path from "path"
import reactSWC from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'
import { componentTagger } from "lovable-tagger"
import critical from 'rollup-plugin-critical'

// Plugin to add preload hints for critical resources
const preloadCriticalPlugin = () => ({
  name: 'preload-critical',
  transformIndexHtml: {
    order: 'pre' as const,
    handler(html: string) {
      // Extract script and link tags to add preload hints
      const scriptMatches = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
      const cssMatches = html.match(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi) || [];
      
      let preloadTags = '\n    <!-- Preload critical resources to reduce dependency chain -->';
      
      // Add preload for main JS bundles
      scriptMatches.forEach(tag => {
        const srcMatch = tag.match(/src=["']([^"']+)["']/);
        if (srcMatch && srcMatch[1] && (srcMatch[1].includes('/assets/js/index-') || srcMatch[1].includes('/assets/js/react-'))) {
          preloadTags += `\n    <link rel="modulepreload" href="${srcMatch[1]}" crossorigin>`;
        }
      });
      
      // Add preload for critical CSS
      cssMatches.forEach(tag => {
        const hrefMatch = tag.match(/href=["']([^"']+)["']/);
        if (hrefMatch && hrefMatch[1]) {
          preloadTags += `\n    <link rel="preload" href="${hrefMatch[1]}" as="style">`;
        }
      });
      
      if (preloadTags.length > 60) {
        return html.replace('</head>', `${preloadTags}\n  </head>`);
      }
      return html;
    }
  }
});

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
        passes: 2, // Multiple passes for better optimization
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
      },
      mangle: {
        safari10: true,
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
      extract: true,
      dimensions: [{
        width: 375,
        height: 667
      }, {
        width: 1920,
        height: 1080
      }],
      // Ignore external stylesheets and focus on inline critical CSS
      ignore: {
        atrule: ['@font-face'],
        decl: (node: any, value: any) => {
          // Keep only critical properties
          return /url\(/.test(value);
        }
      },
      // Increase threshold for critical CSS detection
      penthouse: {
        timeout: 60000,
        pageLoadSkipTimeout: 10000,
        renderWaitTime: 1000,
        blockJSRequests: false,
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
