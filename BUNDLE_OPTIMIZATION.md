# Bundle Optimization Guide

## Overview
This document explains the bundle optimization strategies implemented to reduce unused JavaScript and improve load times.

## Problem
Initial analysis showed:
- **193 KiB** of unused JavaScript
- Charts library: 81% unused (81KB)
- UI components: 88% unused (27KB)  
- Supabase: 79% unused (26KB)
- Main bundle: 52% unused (62KB)

## Solutions Implemented

### 1. Enhanced Code Splitting (vite.config.ts)
**Changed from**: Simple manual chunks strategy
**Changed to**: Dynamic chunks based on actual usage patterns

```typescript
manualChunks: (id) => {
  // Split by usage frequency and loading priority
  if (id.includes('react-core')) return 'react-core';
  if (id.includes('charts')) return 'charts'; // Lazy loaded
  if (id.includes('@radix-ui')) {
    // Split UI components by frequency
    if (high_frequency) return 'ui-core';
    else return 'ui-extended';
  }
}
```

**Benefits**:
- Smaller initial bundles
- Better caching (vendors don't change often)
- Load heavy libraries only when needed

### 2. Lazy Chart Loading
**New files**:
- `src/components/charts/LazyChart.tsx` - Wrapper component
- `src/components/charts/ChartRenderer.tsx` - Actual implementation

**Usage**:
```tsx
// Before (loads entire recharts library)
import { LineChart } from 'recharts';

// After (loads only when chart is rendered)
import { LazyChart } from '@/components/charts/LazyChart';
<LazyChart type="line" data={data} />
```

**Impact**: ~81KB saved on initial load

### 3. Lazy Load Helper
**New file**: `src/lib/lazy-load-helper.ts`

Provides utilities for:
- Smart component preloading (on hover)
- Conditional loading based on route
- Library lazy loading

**Usage**:
```typescript
const HeavyComponent = lazyLoad(
  () => import('./HeavyComponent'),
  { preload: true } // Preload on hover
);
```

### 4. Improved Tree Shaking
**Enhanced terser settings**:
```typescript
terserOptions: {
  compress: {
    passes: 2,              // Multiple optimization passes
    unsafe_comps: true,     // Aggressive comparisons optimization
    unsafe_math: true,      // Math operations optimization
    unsafe_methods: true,   // Method call optimization
  }
}
```

### 5. Dependency Optimization
**Excluded heavy dependencies from pre-bundling**:
- `@huggingface/transformers` (AI/ML - 50MB+)
- `three` (3D rendering - 600KB)
- `@react-three/*` (3D helpers)

These are now loaded on-demand only when needed.

## Expected Results

### Before:
- Initial JS: ~350KB
- Unused code: 193KB (55%)
- Charts always loaded: 100KB
- FCP: 0.8s
- LCP: 1.0s

### After (Expected):
- Initial JS: ~200KB (-43%)
- Unused code: <50KB (-74%)
- Charts loaded on demand
- FCP: 0.6s (-25%)
- LCP: 0.8s (-20%)

## Usage Guidelines

### For Developers

#### 1. When adding new heavy dependencies:
```typescript
// ❌ Bad - loads immediately
import HeavyLib from 'heavy-library';

// ✅ Good - loads on demand
const HeavyLib = lazy(() => import('heavy-library'));
```

#### 2. When using charts:
```tsx
// ❌ Bad
import { BarChart } from 'recharts';

// ✅ Good
import { LazyChart } from '@/components/charts/LazyChart';
<LazyChart type="bar" data={data} />
```

#### 3. When creating new pages:
```typescript
// Always use lazy loading for page components
const NewPage = lazy(() => import('@/pages/NewPage'));
```

## Monitoring

Monitor bundle sizes using:
```bash
npm run build -- --analyze
```

Check for:
- Individual chunk sizes (should be <100KB)
- Duplicate dependencies
- Unused exports

## Future Optimizations

1. **Virtual scrolling** for long lists
2. **Image optimization** - WebP format, lazy loading
3. **Service Worker** - Precache critical resources
4. **Route-based splitting** - Split by user roles
5. **Analytics** - Track which features are actually used

## Notes

- All optimizations preserve existing functionality
- No UI/UX changes
- Backward compatible
- Performance improvements visible in production builds only
