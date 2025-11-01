/**
 * Dynamic imports for heavy libraries
 * Load them only when needed
 */

// Lazy load chart libraries
export const loadChartLibrary = async () => {
  const { Chart } = await import("chart.js");
  return Chart;
};

// Lazy load 3D libraries
export const load3DLibrary = async () => {
  const THREE = await import("three");
  return THREE;
};

// Lazy load fabric.js for canvas
export const loadFabricLibrary = async () => {
  const fabric = await import("fabric");
  return fabric;
};

// Lazy load PDF generation
export const loadPDFLibrary = async () => {
  const jsPDF = await import("jspdf");
  return jsPDF;
};

// Lazy load AI/ML libraries
export const loadAILibrary = async () => {
  const transformers = await import("@huggingface/transformers");
  return transformers;
};

// Lazy load html2canvas
export const loadHTML2Canvas = async () => {
  const html2canvas = (await import("html2canvas")).default;
  return html2canvas;
};

/**
 * Code splitting helper
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(importFunc);
  (LazyComponent as any).preload = importFunc;
  return LazyComponent;
}

import React from "react";
