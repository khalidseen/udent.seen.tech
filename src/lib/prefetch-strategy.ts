/**
 * Intelligent prefetch strategy based on user behavior
 */

interface PrefetchConfig {
  routes: string[];
  priority: "high" | "medium" | "low";
  delay?: number;
}

class PrefetchManager {
  private prefetched = new Set<string>();
  private pendingPrefetch = new Map<string, NodeJS.Timeout>();

  /**
   * Prefetch a route based on priority
   */
  prefetchRoute(route: string, priority: "high" | "medium" | "low" = "medium") {
    if (this.prefetched.has(route)) return;

    const delay = this.getDelayByPriority(priority);

    const timeout = setTimeout(() => {
      this.executePrefetch(route);
      this.pendingPrefetch.delete(route);
    }, delay);

    this.pendingPrefetch.set(route, timeout);
  }

  /**
   * Cancel pending prefetch
   */
  cancelPrefetch(route: string) {
    const timeout = this.pendingPrefetch.get(route);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingPrefetch.delete(route);
    }
  }

  /**
   * Prefetch on hover (intelligent prediction)
   */
  prefetchOnHover(route: string) {
    this.prefetchRoute(route, "high");
  }

  /**
   * Prefetch likely next routes
   */
  prefetchLikelyRoutes(currentRoute: string) {
    const predictions = this.predictNextRoutes(currentRoute);
    predictions.forEach((route) => this.prefetchRoute(route, "medium"));
  }

  /**
   * Execute the actual prefetch
   */
  private executePrefetch(route: string) {
    if (typeof document === "undefined") return;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = route;
    document.head.appendChild(link);

    this.prefetched.add(route);
  }

  /**
   * Get delay based on priority
   */
  private getDelayByPriority(priority: "high" | "medium" | "low"): number {
    switch (priority) {
      case "high":
        return 0;
      case "medium":
        return 1000;
      case "low":
        return 3000;
      default:
        return 1000;
    }
  }

  /**
   * Predict next routes based on current route
   */
  private predictNextRoutes(currentRoute: string): string[] {
    const predictions: Record<string, string[]> = {
      "/": ["/patients", "/appointments", "/financial-overview"],
      "/patients": ["/appointments/new", "/financial-transactions"],
      "/appointments": ["/patients", "/appointments/new"],
      "/financial-overview": ["/invoice-management", "/payment-management"],
    };

    return predictions[currentRoute] || [];
  }

  /**
   * Clear all prefetch data
   */
  clear() {
    this.pendingPrefetch.forEach((timeout) => clearTimeout(timeout));
    this.pendingPrefetch.clear();
    this.prefetched.clear();
  }
}

export const prefetchManager = new PrefetchManager();

/**
 * React hook for prefetching
 */
export function usePrefetchOnHover(route: string) {
  return {
    onMouseEnter: () => prefetchManager.prefetchOnHover(route),
    onTouchStart: () => prefetchManager.prefetchOnHover(route),
  };
}
