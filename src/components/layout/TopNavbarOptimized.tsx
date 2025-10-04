import React, { memo } from 'react';
import { TopNavbar } from './TopNavbar';

// Memoized version to prevent unnecessary re-renders
export const TopNavbarOptimized = memo(TopNavbar, (prevProps, nextProps) => {
  // TopNavbar doesn't receive props, so it only re-renders when internal state changes
  return true; // Always prevent re-render unless forced
});

TopNavbarOptimized.displayName = 'TopNavbarOptimized';
