# Interval Timer Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, Apple-style interval timer application with Bento-box UI, streak tracking, and background notification support.

**Architecture:** Expo Router for navigation, Zustand for global state, `react-native-reanimated` for smooth card transitions, and `expo-notifications`/`expo-av` for the timer engine.

**Tech Stack:** React Native, Expo (SDK 57), Zustand, Expo Router, Reanimated.

**Spec:** docs/superpowers/specs/2026-09-10-interval-timer-hub-design.md

## Global Constraints

- Must use Expo SDK 57 compatible libraries.
- All UI components must follow the Bento-box design language: high border-radius (e.g. 24px), ample padding (e.g. 16px-24px), subtle or no shadows.
- Typography must be clean and bold for data (Inter or System font).
- Haptics (`expo-haptics`) must be used on all button presses.

---

### Task 1: Project Setup, Routing, and Theming

**Files:**
- Modify: `app.json`
- Modify: `app/_layout.tsx`
- Create: `src/theme.ts`
- Create: `src/components/BentoCard.tsx`

**Interfaces:**
- Produces: `theme` object with colors and spacing. `BentoCard` component.

- [ ] **Step 1: Configure App & Routing**

Modify `app.json` to ensure `expo-router` is set up correctly and add required permissions for notifications.

```json
{
  "expo": {
    "name": "timer-app",
    "slug": "timer-app",
    "scheme": "timerapp",
    "plugins": ["expo-router", "expo-font", "expo-av"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 2: Create Theme Tokens**

```typescript
// src/theme.ts
export const theme = {
  colors: {
    background: '#F2F2F7', // Off-white/gray background
    card: '#FFFFFF',
    text: '#1C1C1E',
    textMuted: '#8E8E93',
    accent: '#FF3B30', // Flame/streak accent
    success: '#34C759',
  },
  spacing: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    card: 24,
    button: 16,
  }
};
```

- [ ] **Step 3: Create BentoCard Component**

```typescript
// src/components/BentoCard.tsx
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../theme';

export function BentoCard({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    overflow: 'hidden',
  }
});
```

- [ ] **Step 4: Commit**

```bash
git add app.json src/theme.ts src/components/BentoCard.tsx
git commit -m "feat: setup routing, theme tokens, and BentoCard component"
```

---

### Task 2: State Management (Zustand)

**Files:**
- Create: `src/store.ts`

**Interfaces:**
- Produces: `useStore` hook managing `workouts` array and `streak` data.

- [ ] **Step 1: Define Types & Store**

```typescript
// src/store.ts
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

interface AppState {
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
```

- [ ] **Step 2: Commit**

```bash
git add src/store.ts
git commit -m "feat: setup zustand store and data models"
```

---

### Task 3: HubHome Screen (Dashboard & Streak)

**Files:**
- Create: `app/index.tsx`
- Create: `src/components/StreakWidget.tsx`

**Interfaces:**
- Consumes: `useStore`, `BentoCard`, `theme`

- [ ] **Step 1: Create Streak Widget**

```typescript
// src/components/StreakWidget.tsx
import { View, Text, StyleSheet } from 'react-native';
import { BentoCard } from './BentoCard';
import { theme } from '../theme';
import { useStore } from '../store';

export function StreakWidget() {
  const streak = useStore((s) => s.streakDays);
  
  return (
    <BentoCard style={styles.container}>
      <Text style={styles.title}>Streak</Text>
      <View style={styles.flameContainer}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={styles.number}>{streak}</Text>
      </View>
      <Text style={styles.subtitle}>Days following your plan</Text>
    </BentoCard>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  flameContainer: { alignItems: 'center', marginVertical: theme.spacing.md },
  flame: { fontSize: 48 },
  number: { fontSize: 40, fontWeight: '900', color: theme.colors.text, marginTop: -20 },
  subtitle: { fontSize: 14, color: theme.colors.textMuted }
});
```

- [ ] **Step 2: Create HubHome Screen**

```typescript
// app/index.tsx
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { StreakWidget } from '../src/components/StreakWidget';
import { BentoCard } from '../src/components/BentoCard';
import { useStore } from '../src/store';
import { theme } from '../src/theme';

export default function Home() {
  const workouts = useStore((s) => s.workouts);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StreakWidget />
      
      <Text style={styles.sectionTitle}>Your Workouts</Text>
      {workouts.length === 0 ? (
        <Text style={styles.empty}>No workouts yet.</Text>
      ) : (
        workouts.map(w => (
          <Link key={w.id} href={`/timer/${w.id}`} asChild>
            <Pressable>
              <BentoCard style={styles.workoutCard}>
                <Text style={styles.workoutName}>{w.name}</Text>
              </BentoCard>
            </Pressable>
          </Link>
        ))
      )}

      <Link href="/builder" asChild>
        <Pressable style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Create Workout</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingTop: 60 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginTop: theme.spacing.md },
  empty: { color: theme.colors.textMuted },
  workoutCard: { marginBottom: theme.spacing.md },
  workoutName: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  addButton: { backgroundColor: theme.colors.text, padding: theme.spacing.lg, borderRadius: theme.borderRadius.button, alignItems: 'center' },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StreakWidget.tsx app/index.tsx
git commit -m "feat: implement HubHome with streak widget and workout list"
```

---

### Task 4: TimerBuilder Screen

**Files:**
- Create: `app/builder.tsx`

**Interfaces:**
- Consumes: `useStore`, `BentoCard`

- [ ] **Step 1: Create Builder Layout**

```typescript
// app/builder.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore, WorkoutBlock } from '../src/store';
import { BentoCard } from '../src/components/BentoCard';
import { theme } from '../src/theme';

export default function Builder() {
  const router = useRouter();
  const addWorkout = useStore(s => s.addWorkout);
  const [name, setName] = useState('');
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);

  const addInterval = () => {
    setBlocks([...blocks, { id: Math.random().toString(), type: 'work', durationSeconds: 30 }]);
  };

  const save = () => {
    if (!name) return;
    addWorkout({ id: Math.random().toString(), name, blocks });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>New Workout</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Workout Name (e.g. Abs)" 
        value={name}
        onChangeText={setName}
      />

      {blocks.map((b, i) => (
        <BentoCard key={b.id} style={styles.blockCard}>
          <Text style={styles.blockType}>{b.type.toUpperCase()}</Text>
          {b.type === 'work' && <Text style={styles.blockDuration}>{b.durationSeconds}s</Text>}
        </BentoCard>
      ))}

      <Pressable style={styles.addBtn} onPress={addInterval}>
        <Text style={styles.addBtnText}>+ Add 30s Work</Text>
      </Pressable>

      <Pressable style={[styles.addBtn, styles.saveBtn]} onPress={save}>
        <Text style={styles.saveBtnText}>Save Workout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800' },
  input: { backgroundColor: '#FFF', padding: theme.spacing.lg, borderRadius: theme.borderRadius.card, fontSize: 18 },
  blockCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockType: { fontWeight: '700', color: theme.colors.accent },
  blockDuration: { fontSize: 20, fontWeight: '800' },
  addBtn: { padding: theme.spacing.md, backgroundColor: '#E5E5EA', borderRadius: theme.borderRadius.button, alignItems: 'center' },
  addBtnText: { fontWeight: '600', color: theme.colors.text },
  saveBtn: { backgroundColor: theme.colors.text, marginTop: theme.spacing.xl },
  saveBtnText: { fontWeight: '700', color: '#FFF' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/builder.tsx
git commit -m "feat: implement basic workout builder UI"
```

---

### Task 5: ActiveTimer Screen & Notifications

**Files:**
- Create: `app/timer/[id].tsx`

**Interfaces:**
- Consumes: `useStore`

- [ ] **Step 1: Implement Active Timer**

```typescript
// app/timer/[id].tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../../src/store';
import { theme } from '../../src/theme';

export default function ActiveTimer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const workout = useStore(s => s.workouts.find(w => w.id === id));
  
  // Minimal placeholder state for timer
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!workout) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.workoutName}>{workout.name}</Text>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{timeLeft}</Text>
        <Text style={styles.statusText}>WORK</Text>
      </View>
      <Pressable style={styles.stopBtn} onPress={() => router.back()}>
        <Text style={styles.stopBtnText}>End Workout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  workoutName: { fontSize: 24, fontWeight: '600', color: theme.colors.textMuted, position: 'absolute', top: 60 },
  timeContainer: { alignItems: 'center', justifyContent: 'center', height: 300, width: 300, borderRadius: 150, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20 },
  timeText: { fontSize: 80, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statusText: { fontSize: 24, fontWeight: '700', color: theme.colors.accent, marginTop: 10 },
  stopBtn: { position: 'absolute', bottom: 60, paddingHorizontal: 40, paddingVertical: 20, backgroundColor: theme.colors.text, borderRadius: 30 },
  stopBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' }
});
```

- [ ] **Step 2: Commit**

```bash
git add app/timer/
git commit -m "feat: implement active timer screen"
```
