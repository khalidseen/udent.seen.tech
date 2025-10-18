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
      // Extract script and link tags to add preload hints
      const scriptMatches = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
      const cssMatches = html.match(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi) || [];
      
      let preloadTags = '\n    <!-- Resource hints to reduce latency -->';
      preloadTags += '\n    <link rel="dns-prefetch" href="https://fonts.googleapis.com">';
      preloadTags += '\n    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>';
      preloadTags += '\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
      
      // Add preconnect for Supabase if used
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        const domain = new URL(supabaseUrl).origin;
        preloadTags += `\n    <link rel="dns-prefetch" href="${domain}">`;
        preloadTags += `\n    <link rel="preconnect" href="${domain}" crossorigin>`;
      }
      
      preloadTags += '\n    <!-- Preload critical resources to reduce dependency chain -->';
      
      // Add preload for critical CSS with high priority
      cssMatches.forEach(tag => {
        const hrefMatch = tag.match(/href=["']([^"']+)["']/);
        if (hrefMatch && hrefMatch[1]) {
          preloadTags += `\n    <link rel="preload" href="${hrefMatch[1]}" as="style" fetchpriority="high">`;
        }
      });
      
      // Add modulepreload for main JS bundles with high priority
      scriptMatches.forEach(tag => {
        const srcMatch = tag.match(/src=["']([^"']+)["']/);
        if (srcMatch && srcMatch[1] && (srcMatch[1].includes('/assets/js/index-') || srcMatch[1].includes('/assets/js/react-'))) {
          preloadTags += `\n    <link rel="modulepreload" href="${srcMatch[1]}" fetchpriority="high" crossorigin>`;
        }
      });
      
      if (preloadTags.length > 60) {
        return html.replace('</head>', `${preloadTags}\n  </head>`);
      }
      return html;
    }
  }
});

// Simplified CSS loading - let critical CSS handle most optimization
const deferCSSPlugin = () => ({
  name: 'defer-css',
  transformIndexHtml: {
    order: 'post' as const,
    handler(html: string) {
      // Only defer non-critical CSS that wasn't inlined by critical plugin
      // Use simple preload approach with immediate activation
      let noscriptTags = '';
      
      const transformedHtml = html.replace(
        /<link([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi,
        (match, before, middle, href, after) => {
          // Skip if already processed or is critical
          if (match.includes('onload=') || match.includes('fonts.googleapis') || match.includes('data-critical')) {
            return match;
          }
          // Add noscript fallback
          noscriptTags += `<noscript><link rel="stylesheet" href="${href}"></noscript>`;
          // Use preload with immediate activation - no media tricks
          return `<link${before}rel="preload"${middle}href="${href}"${after} as="style" onload="this.onload=null;this.rel='stylesheet'">`;
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
      extract: false, // Don't extract to separate file - inline everything critical
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
        atrule: [],
        decl: () => false // Don't ignore any declarations
      },
      penthouse: {
        timeout: 180000, // Increase timeout
        pageLoadSkipTimeout: 40000,
        renderWaitTime: 8000, // Wait longer to ensure full render
        blockJSRequests: false,
        forceInclude: [
          // Layout and structural elements
          '.hero', '.header', '.nav', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'section', 'article', 'main',
          'button', '.btn', 'input', 'label', 'form', 'a', 
          // All text utility classes that might affect LCP text
          '.text-sm', '.text-base', '.text-lg', '.text-xl', '.text-2xl', '.text-3xl',
          '.text-muted-foreground', '.text-foreground', '.text-primary', '.text-secondary',
          '.text-muted', '.text-card-foreground', '.text-popover-foreground',
          // Layout utilities
          '.flex', '.grid', '.container', '.w-full', '.w-', '.h-', '.max-w-',
          '.rounded', '.rounded-lg', '.rounded-md', '.rounded-sm',
          '.shadow', '.shadow-sm', '.shadow-md', '.shadow-lg',
          '.border', '.border-t', '.border-b', '.border-l', '.border-r',
          '.p-', '.px-', '.py-', '.pt-', '.pb-', '.pl-', '.pr-',
          '.m-', '.mx-', '.my-', '.mt-', '.mb-', '.ml-', '.mr-',
          '.space-', '.gap-',
          // Color utilities
          '.bg-', '.bg-background', '.bg-card', '.bg-primary', '.bg-secondary',
          // Everything in viewport
          'body', 'html', '*'
        ],
        strict: false,
        maxEmbeddedBase64Length: 8000, // Inline more assets
        keepLargerMediaQueries: true,
        propertiesToRemove: [
          '(.*)animation(.*)',
          '(.*)transition(.*)'
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
