/**
 * Dynamic imports for heavy libraries - load only when needed
 */
import React from "react";

export const loadChartLibrary = async () => {
  const { Chart } = await import("chart.js");
  return Chart;
};

export const loadPDFLibrary = async () => {
  const jsPDF = await import("jspdf");
  return jsPDF;
};

export const loadHTML2Canvas = async () => {
  const html2canvas = (await import("html2canvas")).default;
  return html2canvas;
};

export function lazyWithPreload<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(importFunc);
  (LazyComponent as any).preload = importFunc;
  return LazyComponent;
}
