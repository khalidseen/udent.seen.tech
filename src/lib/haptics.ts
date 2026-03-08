/**
 * Haptic feedback utility for mobile devices.
 * Uses the Vibration API as a fallback since Web Haptics API isn't widely supported yet.
 */

export type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection';

const patterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  selection: 15,
  medium: 25,
  heavy: 50,
};

export function triggerHaptic(style: HapticStyle = 'light') {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(patterns[style]);
    }
  } catch {
    // Silently fail — not all devices support vibration
  }
}
