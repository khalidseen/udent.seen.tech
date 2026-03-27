/**
 * Production-safe logger. Strips all log/warn/info/debug output in production builds.
 * console.error is always preserved (needed for error tracking).
 */
const isDev = import.meta.env.DEV;

export const logger = {
  log: isDev ? console.log.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  info: isDev ? console.info.bind(console) : () => {},
  debug: isDev ? console.debug.bind(console) : () => {},
  /** Always active — errors should always be visible */
  error: console.error.bind(console),
};
