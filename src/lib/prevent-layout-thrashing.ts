// Utility to prevent layout thrashing by batching DOM operations
// This helps reduce forced reflows that hurt performance

import { layoutBatcher } from './layout-optimization';

// Properties that cause forced reflow when read
const LAYOUT_PROPERTIES = [
  'offsetTop', 'offsetLeft', 'offsetWidth', 'offsetHeight',
  'scrollTop', 'scrollLeft', 'scrollWidth', 'scrollHeight',
  'clientTop', 'clientLeft', 'clientWidth', 'clientHeight',
  'getComputedStyle', 'getBoundingClientRect', 'getClientRects',
  'innerText', 'offsetParent'
];

// Batch multiple style changes
export const batchStyleChanges = (
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
) => {
  layoutBatcher.write(() => {
    Object.assign(element.style, styles);
  });
};

// Read layout properties safely
export const readLayout = <T>(
  element: HTMLElement,
  reader: (el: HTMLElement) => T
): Promise<T> => {
  return new Promise((resolve) => {
    layoutBatcher.read(() => {
      const result = reader(element);
      resolve(result);
    });
  });
};

// Optimize scroll operations
export const optimizedScroll = (
  element: HTMLElement | Window,
  options: ScrollToOptions
) => {
  layoutBatcher.write(() => {
    element.scrollTo(options);
  });
};

// Safe way to get element dimensions
export const getElementDimensions = (
  element: HTMLElement
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    layoutBatcher.read(() => {
      resolve({
        width: element.offsetWidth,
        height: element.offsetHeight
      });
    });
  });
};

// Initialize global optimization
export const initLayoutOptimization = () => {
  // Use IntersectionObserver for visibility checks instead of scroll listeners
  // This prevents forced reflows from getBoundingClientRect calls
  
  // Debounce resize handlers globally
  let resizeTimeout: NodeJS.Timeout;
  const originalAddEventListener = window.addEventListener;
  
  window.addEventListener = function(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === 'resize' && typeof listener === 'function') {
      const debouncedListener = (event: Event) => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => listener(event), 100);
      };
      return originalAddEventListener.call(this, type, debouncedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
};
