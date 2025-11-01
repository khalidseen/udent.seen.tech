/**
 * Critical CSS utilities for above-the-fold content
 */

export const criticalStyles = `
  /* Reset & Base Styles */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    -webkit-text-size-adjust: 100%;
    font-family: ui-sans-serif, system-ui, sans-serif;
  }

  body {
    margin: 0;
    line-height: inherit;
  }

  /* Critical Layout Styles */
  .min-h-screen {
    min-height: 100vh;
  }

  .flex {
    display: flex;
  }

  .grid {
    display: grid;
  }

  .hidden {
    display: none;
  }

  /* Critical Colors (Light Mode) */
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
  }

  /* Critical Spacing */
  .p-4 { padding: 1rem; }
  .p-6 { padding: 1.5rem; }
  .gap-4 { gap: 1rem; }
  .space-y-4 > * + * { margin-top: 1rem; }

  /* Loading State */
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Critical Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 150ms;
  }

  /* Skeleton Loader */
  .skeleton {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    background-color: hsl(var(--muted));
    border-radius: 0.375rem;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

/**
 * Inject critical CSS into document head
 */
export function injectCriticalCSS() {
  if (typeof document === "undefined") return;

  const existingStyle = document.getElementById("critical-css");
  if (existingStyle) return; // Already injected

  const style = document.createElement("style");
  style.id = "critical-css";
  style.textContent = criticalStyles;
  document.head.appendChild(style);
}

/**
 * Extract critical CSS for a specific component
 */
export function extractComponentCSS(selector: string): string {
  if (typeof document === "undefined") return "";

  const element = document.querySelector(selector);
  if (!element) return "";

  const styles = window.getComputedStyle(element);
  const criticalProps = [
    "display",
    "position",
    "width",
    "height",
    "margin",
    "padding",
    "color",
    "background-color",
    "font-size",
    "font-weight",
  ];

  let css = `${selector} {\n`;
  criticalProps.forEach((prop) => {
    const value = styles.getPropertyValue(prop);
    if (value) {
      css += `  ${prop}: ${value};\n`;
    }
  });
  css += "}\n";

  return css;
}
