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
  lastWorkoutDate: string | null;
  workoutDates: string[];
  lastRestoreDate: string | null;
  totalWorkoutsLogged: number;
  totalMinutesLogged: number;
  themePreference: ThemePreference;
  addWorkout: (workout: Workout) => void;
  removeWorkout: (id: string) => void;
  updateWorkout: (id: string, workout: Workout) => void;
  logWorkout: (durationSeconds: number) => void;
  restoreStreak: () => void;
  setThemePreference: (pref: ThemePreference) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      workouts: [],
      streakDays: 0,
      lastWorkoutDate: null,
      workoutDates: [],
      lastRestoreDate: null,
      totalWorkoutsLogged: 0,
      totalMinutesLogged: 0,
      themePreference: 'system',
      addWorkout: (workout) => set((state) => ({ workouts: [...state.workouts, workout] })),
      removeWorkout: (id) => set((state) => ({ workouts: state.workouts.filter(w => w.id !== id) })),
      updateWorkout: (id, workout) => set((state) => ({ 
        workouts: state.workouts.map(w => w.id === id ? workout : w) 
      })),
      logWorkout: (durationSeconds) => {
        const today = new Date().toLocaleDateString('en-CA');
        
        set((state) => {
          const newWorkouts = state.totalWorkoutsLogged + 1;
          const newMinutes = state.totalMinutesLogged + Math.round(durationSeconds / 60);

          if (state.lastWorkoutDate === today) {
            return { totalWorkoutsLogged: newWorkouts, totalMinutesLogged: newMinutes };
          }
          
          const newDates = [...state.workoutDates, today];
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString('en-CA');
          
          let newStreak = state.streakDays;
          if (state.lastWorkoutDate === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          
          return { 
            workoutDates: newDates, 
            lastWorkoutDate: today,
            streakDays: newStreak,
            totalWorkoutsLogged: newWorkouts,
            totalMinutesLogged: newMinutes
          };
        });
      },
      restoreStreak: () => {
        set((state) => {
          const today = new Date().toLocaleDateString('en-CA');
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString('en-CA');
          
          if (!state.workoutDates.includes(yesterdayStr)) {
            return { 
              workoutDates: [...state.workoutDates, yesterdayStr],
              lastWorkoutDate: yesterdayStr,
              lastRestoreDate: today
            };
          }
          return state;
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
