import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Enhanced lazy loading with retry logic and error handling
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  componentName: string = 'Component'
): LazyExoticComponent<T> {
  return lazy(() =>
    componentImport()
      .catch((error) => {
        console.error(`Failed to load ${componentName}:`, error);
        // Retry once after a short delay
        return new Promise<{ default: T }>((resolve) => {
          setTimeout(() => {
            componentImport()
              .then(resolve)
              .catch((retryError) => {
                console.error(`Retry failed for ${componentName}:`, retryError);
                // Return a fallback component
                throw retryError;
              });
          }, 1000);
        });
      })
  );
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): void {
  componentImport().catch((error) => {
    console.error('Failed to preload component:', error);
  });
}

/**
 * Create a lazy component with preload capability
 */
export function createLazyComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  componentName: string = 'Component'
) {
  const LazyComponent = lazyWithRetry(componentImport, componentName);
  
  return {
    Component: LazyComponent,
    preload: () => preloadComponent(componentImport),
  };
}
