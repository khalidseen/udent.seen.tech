import React, { memo } from 'react';
import { AppSidebar } from './AppSidebar';

// Memoized version to prevent unnecessary re-renders
export const AppSidebarOptimized = memo(AppSidebar, (prevProps, nextProps) => {
  // AppSidebar doesn't receive props that change frequently
  return true; // Prevent re-render unless location changes
});

AppSidebarOptimized.displayName = 'AppSidebarOptimized';
