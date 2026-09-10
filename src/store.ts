import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type IntervalBlock = {
  id: string;
  type: 'work' | 'rest';
  durationSeconds: number;
};

export type LoopBlock = {
  id: string;
  type: 'loop';
  iterations: number;
  blocks: IntervalBlock[];
};

export type WorkoutBlock = IntervalBlock | LoopBlock;

export type Workout = {
  id: string;
  name: string;
  blocks: WorkoutBlock[];
};

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppState {
  workouts: Workout[];
  streakDays: number;
  themePreference: ThemePreference;
  addWorkout: (workout: Workout) => void;
  removeWorkout: (id: string) => void;
  updateWorkout: (id: string, workout: Workout) => void;
  incrementStreak: () => void;
  setThemePreference: (pref: ThemePreference) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      workouts: [],
      streakDays: 0,
      themePreference: 'system',
      addWorkout: (workout) => set((state) => ({ workouts: [...state.workouts, workout] })),
      removeWorkout: (id) => set((state) => ({ workouts: state.workouts.filter(w => w.id !== id) })),
      updateWorkout: (id, workout) => set((state) => ({ 
        workouts: state.workouts.map(w => w.id === id ? workout : w) 
      })),
      incrementStreak: () => set((state) => ({ streakDays: state.streakDays + 1 })),
      setThemePreference: (pref) => set({ themePreference: pref }),
    }),
    {
      name: 'timer-hub-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
