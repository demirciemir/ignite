# Design Specification: Premium Interval Timer & Sports Hub

## 1. Overview
A premium, Apple-style interval timer application that serves as the foundational module for a future "Sports & Health Hub". The app focuses on an exceptional user experience (UI/UX) with smooth animations, high-quality typography, and intuitive interval building.

## 2. Scope & Phasing
**Phase 1 (Current):**
- Core "Hub" Dashboard (Home screen).
- "Bento Box" UI style (rounded cards, ample whitespace, modern typography).
- Interval Timer Builder (ability to create Work, Rest, and Loop blocks).
- Active Timer execution (Foreground counting + Background scheduled notifications).
- Local persistence of saved workouts.

**Phase 2 & Beyond (Out of Scope for now):**
- Water Reminder widget.
- Native Swift Module for Dynamic Island and Live Activities.

## 3. UI/UX & Design Language (Emil Kowalski & Apple Guidelines)
- **Typography:** System fonts (San Francisco/Inter) with optical sizing. Massive, bold font weights for active timers; muted, smaller weights for labels.
- **Layout:** Bento-box card system. High border-radius (20-24px), very subtle borders, and soft contrast. 
- **Navigation:** Floating "pill" style bottom navigation or clean tab bar.
- **Interactions & Motion:** 
  - Every button press and state change will have haptic feedback (`expo-haptics`).
  - Spring-based, interruptible animations for screen transitions and opening modals (`react-native-reanimated`).
- **User Flow (Timer Builder):** Creating a timer must feel effortless. Instead of complex forms, users will tap an "Add" button to append a "Work", "Rest", or "Loop" block. Modals will slide up smoothly from the bottom to select durations.

## 4. Architecture & Stack
- **Framework:** React Native + Expo (SDK 57).
- **Routing:** Expo Router (file-based navigation).
- **State Management:** Zustand (for saving workouts and active timer state).
- **Styling:** Native StyleSheet with a strict design token system (Colors, Spacing, Typography).
- **Timer Engine:** 
  - *Foreground:* `setInterval` coupled with accurate `Date.now()` diffing. Audio via `expo-av`.
  - *Background:* `expo-notifications` to schedule local push notifications at the exact end-time of each interval to ensure the user hears the transition even if the phone is locked.

## 5. Data Model
```typescript
type IntervalBlock = {
  id: string;
  type: 'work' | 'rest';
  durationSeconds: number;
};

type LoopBlock = {
  id: string;
  type: 'loop';
  iterations: number;
  blocks: IntervalBlock[]; // The intervals to repeat
};

type WorkoutBlock = IntervalBlock | LoopBlock;

type Workout = {
  id: string;
  name: string; // e.g., "Karın Antrenmanı"
  color: string; // Accent color for the card
  blocks: WorkoutBlock[];
};
```

## 6. Verification & Testing
- Verify timer accuracy by leaving the app in the foreground for 5 minutes.
- Verify background functionality by locking the device during an active interval and ensuring the notification/sound triggers at the correct second.
- Verify UI responsiveness and layout on different device sizes.
