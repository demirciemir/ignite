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

export type WorkoutLog = {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  totalDurationSeconds: number;
  workDurationSeconds: number;
  restDurationSeconds: number;
  roundsCompleted: number;
};

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppState {
  workouts: Workout[];
  history: WorkoutLog[];
  streakDays: number;
  lastWorkoutDate: string | null;
  workoutDates: string[];
  restoredDates: string[];
  lastRestoreDate: string | null;
  totalWorkoutsLogged: number;
  totalMinutesLogged: number;
  totalWorkSeconds: number;
  totalRestSeconds: number;
  totalRounds: number;
  themePreference: ThemePreference;
  prepTime: number;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  hasSeenOnboarding: boolean;
  setPrepTime: (time: number) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  justEarnedStreak: boolean;
  addWorkout: (workout: Workout) => void;
  removeWorkout: (id: string) => void;
  updateWorkout: (id: string, workout: Workout) => void;
  logWorkout: (details: { workoutId: string; workoutName: string; totalDurationSeconds: number; workDurationSeconds: number; restDurationSeconds: number; roundsCompleted: number; }) => void;
  restoreStreak: () => void;
  setThemePreference: (pref: ThemePreference) => void;
  clearStreakAnimation: () => void;
  resetAll: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      workouts: [],
      history: [],
      streakDays: 0,
      lastWorkoutDate: null,
      workoutDates: [],
      restoredDates: [],
      lastRestoreDate: null,
      totalWorkoutsLogged: 0,
      totalMinutesLogged: 0,
      totalWorkSeconds: 0,
      totalRestSeconds: 0,
      totalRounds: 0,
      themePreference: 'system',
      prepTime: 3,
      hapticsEnabled: true,
      soundEnabled: true,
      hasSeenOnboarding: false,
      setPrepTime: (time) => set({ prepTime: time }),
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
      justEarnedStreak: false,
      addWorkout: (workout) => set((state) => ({ workouts: [...state.workouts, workout] })),
      removeWorkout: (id) => set((state) => {
          const historyToRemove = (state.history || []).filter(h => h.workoutId === id);
          
          let subtractedMinutes = 0;
          let subtractedWork = 0;
          let subtractedRest = 0;
          let subtractedRounds = 0;
          
          historyToRemove.forEach(h => {
            subtractedMinutes += Math.round(h.totalDurationSeconds / 60);
            subtractedWork += h.workDurationSeconds;
            subtractedRest += h.restDurationSeconds;
            subtractedRounds += h.roundsCompleted;
          });

          return {
            workouts: state.workouts.filter(w => w.id !== id),
            history: (state.history || []).filter(h => h.workoutId !== id),
            totalWorkoutsLogged: Math.max(0, state.totalWorkoutsLogged - historyToRemove.length),
            totalMinutesLogged: Math.max(0, state.totalMinutesLogged - subtractedMinutes),
            totalWorkSeconds: Math.max(0, state.totalWorkSeconds - subtractedWork),
            totalRestSeconds: Math.max(0, state.totalRestSeconds - subtractedRest),
            totalRounds: Math.max(0, (state.totalRounds || 0) - subtractedRounds)
          };
        }),
      updateWorkout: (id, workout) => set((state) => ({ 
        workouts: state.workouts.map(w => w.id === id ? workout : w) 
      })),
      logWorkout: (details) => {
        const now = new Date();
        const today = now.toLocaleDateString('en-CA');
        const logEntry: WorkoutLog = {
          id: Math.random().toString(36).substr(2, 9),
          date: now.toISOString(),
          ...details
        };
        
        set((state) => {
          const newWorkouts = state.totalWorkoutsLogged + 1;
          const newMinutes = state.totalMinutesLogged + Math.round(details.totalDurationSeconds / 60);
          
          const newHistory = [logEntry, ...(state.history || [])];
          const newTotalWork = (state.totalWorkSeconds || 0) + details.workDurationSeconds;
          const newTotalRest = (state.totalRestSeconds || 0) + details.restDurationSeconds;
          const newTotalRounds = (state.totalRounds || 0) + details.roundsCompleted;

          if (state.lastWorkoutDate === today) {
            return { 
              totalWorkoutsLogged: newWorkouts, 
              totalMinutesLogged: newMinutes,
              history: newHistory,
              totalWorkSeconds: newTotalWork,
              totalRestSeconds: newTotalRest,
              totalRounds: newTotalRounds
            };
          }
          
          const newDates = [...(state.workoutDates || []), today];
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
            totalMinutesLogged: newMinutes,
            justEarnedStreak: true,
            history: newHistory,
            totalWorkSeconds: newTotalWork,
            totalRestSeconds: newTotalRest,
            totalRounds: newTotalRounds
          };
        });
      },
      restoreStreak: () => {
        set((state) => {
          const todayDate = new Date();
          const yesterday = new Date(todayDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString('en-CA');
          
          if (!state.workoutDates.includes(yesterdayStr) && state.lastWorkoutDate) {
            const missingDates = [];
            let curr = new Date(state.lastWorkoutDate);
            curr.setDate(curr.getDate() + 1);
            
            while (curr <= yesterday) {
              const dStr = curr.toLocaleDateString('en-CA');
              if (!state.workoutDates.includes(dStr)) {
                missingDates.push(dStr);
              }
              curr.setDate(curr.getDate() + 1);
            }

            if (missingDates.length > 0) {
              return { 
                workoutDates: [...state.workoutDates, ...missingDates],
                restoredDates: [...(state.restoredDates || []), ...missingDates],
                lastWorkoutDate: yesterdayStr,
                lastRestoreDate: new Date().toISOString(),
              };
            }
          }
          return state;
        });
      },
      clearStreakAnimation: () => set({ justEarnedStreak: false }),
      setThemePreference: (pref) => set({ themePreference: pref }),
      resetAll: () => set({
        workouts: [],
        history: [],
        streakDays: 0,
        lastWorkoutDate: null,
        workoutDates: [],
        restoredDates: [],
        lastRestoreDate: null,
        totalWorkoutsLogged: 0,
        totalMinutesLogged: 0,
        totalWorkSeconds: 0,
        totalRestSeconds: 0,
        totalRounds: 0,
        themePreference: 'system',
        prepTime: 3,
        hapticsEnabled: true,
        soundEnabled: true,
        hasSeenOnboarding: false,
        justEarnedStreak: false,
      }),
    }),
    {
      name: 'timer-hub-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
