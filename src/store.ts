import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type IntervalBlock = {
  id: string;
  type: 'work' | 'rest';
  durationSeconds: number;
  name?: string;
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
  workoutDates: string[];
  lastRestoreDate: string | null;
  themePreference: ThemePreference;
  addWorkout: (workout: Workout) => void;
  removeWorkout: (id: string) => void;
  updateWorkout: (id: string, workout: Workout) => void;
  logWorkout: () => void;
  restoreStreak: () => void;
  setThemePreference: (pref: ThemePreference) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      workouts: [],
      streakDays: 0,
      workoutDates: [],
      lastRestoreDate: null,
      themePreference: 'system',
      addWorkout: (workout) => set((state) => ({ workouts: [...state.workouts, workout] })),
      removeWorkout: (id) => set((state) => ({ workouts: state.workouts.filter(w => w.id !== id) })),
      updateWorkout: (id, workout) => set((state) => ({ 
        workouts: state.workouts.map(w => w.id === id ? workout : w) 
      })),
      logWorkout: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => {
          if (state.workoutDates.includes(today)) return state;
          
          const newDates = [...state.workoutDates, today];
          // Simple streak logic: if yesterday was logged, increment. If not, reset to 1.
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          let newStreak = 1;
          if (state.workoutDates.includes(yesterdayStr)) {
            newStreak = state.streakDays + 1;
          }
          return { workoutDates: newDates, streakDays: newStreak };
        });
      },
      restoreStreak: () => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          return { streakDays: state.streakDays + 1, lastRestoreDate: today };
        });
      },
      setThemePreference: (pref) => set({ themePreference: pref }),
    }),
    {
      name: 'timer-hub-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
