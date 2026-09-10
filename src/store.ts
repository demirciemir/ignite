import { create } from 'zustand';

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

export interface AppState {
  workouts: Workout[];
  streakDays: number;
  addWorkout: (workout: Workout) => void;
  incrementStreak: () => void;
}

export const useStore = create<AppState>((set) => ({
  workouts: [],
  streakDays: 0, // In a real app, this would be computed from a history log
  addWorkout: (workout) => set((state) => ({ workouts: [...state.workouts, workout] })),
  incrementStreak: () => set((state) => ({ streakDays: state.streakDays + 1 })),
}));
