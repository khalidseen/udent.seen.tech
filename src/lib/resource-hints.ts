/**
 * Resource hints utilities for performance optimization
 */

/**
 * Add preconnect hints for external resources
 */
export function addPreconnect(urls: string[]) {
  if (typeof document === "undefined") return;

  urls.forEach((url) => {
    try {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = new URL(url).origin;
      link.crossOrigin = "anonymous";
      document.head.appendChild(link);
    } catch (error) {
      console.error("Invalid preconnect URL:", url);
    }
  });
}

/**
 * Add DNS prefetch hints
 */
export function addDNSPrefetch(urls: string[]) {
  if (typeof document === "undefined") return;

  urls.forEach((url) => {
    try {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = new URL(url).origin;
      document.head.appendChild(link);
    } catch (error) {
      console.error("Invalid DNS prefetch URL:", url);
    }
  });
}

/**
 * Preload critical assets
 */
export function preloadAsset(
  href: string,
  as: "script" | "style" | "image" | "font" | "fetch",
  options?: {
    type?: string;
    crossOrigin?: "anonymous" | "use-credentials";
    fetchPriority?: "high" | "low" | "auto";
  }
) {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;

  if (options?.type) {
    link.type = options.type;
  }

  if (options?.crossOrigin) {
    link.crossOrigin = options.crossOrigin;
  }

  if (options?.fetchPriority) {
    link.setAttribute("fetchpriority", options.fetchPriority);
  }

  document.head.appendChild(link);
}

/**
 * Prefetch resources for future navigation
 */
export function prefetchResource(href: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Setup resource hints for Supabase
 */
export function setupSupabaseHints(supabaseUrl: string) {
  addPreconnect([supabaseUrl]);
  addDNSPrefetch([supabaseUrl]);
}

/**
 * Setup resource hints for fonts
 */
export function setupFontHints() {
  addPreconnect([
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
  ]);

  preloadAsset(
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
    "style",
    { fetchPriority: "high" }
  );
}

/**
 * Preload critical routes
 */
export function preloadRoutes(routes: string[]) {
  routes.forEach((route) => {
    prefetchResource(route);
  });
}
