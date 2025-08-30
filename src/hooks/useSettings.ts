import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Settings {
  showDashboardBoxes: boolean;
  boxesPerRow: number;
  boxSize: number;
}

interface SettingsStore {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        showDashboardBoxes: true,
        boxesPerRow: 3,
        boxSize: 200,
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'app-settings',
    }
  )
);
