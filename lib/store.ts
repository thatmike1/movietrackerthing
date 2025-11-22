import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserMode = 'ME' | 'GIRLFRIEND' | 'TOGETHER';

interface AppState {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: 'ME',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'movie-tracker-storage',
    }
  )
);
