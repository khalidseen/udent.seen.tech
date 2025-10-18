/**
 * Enhanced Lazy Loading Helper
 * Provides smarter component loading strategies to reduce unused JavaScript
 */

import { lazy, ComponentType } from 'react';

interface LazyLoadOptions {
  /**
   * Preload the component when user hovers over a link
   */
  preload?: boolean;
  
  /**
   * Delay before loading (in ms)
   */
  delay?: number;
}

/**
 * Creates a lazily loaded component with enhanced loading strategies
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const LazyComponent = lazy(importFn);
  
  // Preload function for hover/interaction
  if (options.preload) {
    (LazyComponent as any).preload = importFn;
  }
  
  return LazyComponent;
}

/**
 * Preload a lazy component on demand (e.g., on hover)
 */
export function preloadComponent(Component: any) {
  if (Component && typeof Component.preload === 'function') {
    Component.preload();
  }
}

/**
 * Lazy load heavy library only when needed
 * Useful for charts, 3D models, etc.
 */
export async function lazyLoadLibrary<T>(
  importFn: () => Promise<T>
): Promise<T> {
  return importFn();
}

/**
 * Check if component should be loaded based on route
 */
export function shouldLoadComponent(currentPath: string, targetPath: string): boolean {
  return currentPath.startsWith(targetPath);
}
