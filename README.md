# Ignite

Ignite is a focused interval timer for iPhone. Build reusable routines, move through work and rest blocks with clear audio and haptic feedback, and keep an honest record of every completed session.

<p align="center">
  <img src="assets/images/icon.png" width="160" alt="Ignite app icon" />
</p>

## Highlights

- Create and edit custom interval routines
- Run multi-block timers with preparation, work, and rest stages
- Continue timing reliably while the app is in the background
- Use sound, haptics, and local notifications for stage changes
- Track completed routines, focus time, rest time, rounds, and streaks
- Browse and filter workout history
- Choose light, dark, or system appearance
- Keep all workout data locally on the device

## Tech stack

- Expo SDK 57
- React Native 0.86
- React 19
- Expo Router
- Zustand with AsyncStorage persistence
- React Native Reanimated and Gesture Handler
- Expo Audio, Notifications, Haptics, and Symbols

## Run locally

Requirements: Node.js LTS and npm.

```bash
npm install
npx expo start
```

Open the project with an Expo development build or Expo Go. For a physical iOS device, sign in to the same Expo account in Expo CLI and Expo Go.

## Useful commands

```bash
npm start          # Start the Expo development server
npm run ios        # Open on an iOS simulator
npm run android    # Open on an Android emulator
npm run web        # Open the web version
npm run lint       # Run Expo lint checks
```

## Production builds

The repository includes EAS Build profiles for development, preview, and production builds.

```bash
npx eas-cli@latest build --platform ios --profile production
```

Production build numbers are managed remotely and increment automatically through EAS.

## Privacy

Ignite stores routines, preferences, history, and streak data locally on the user's device. The app includes in-app Privacy Policy and Terms of Use pages.

## Author

Designed and developed by [Emir Demirci](https://github.com/demirciemir).

## License

This project is available under the terms in [LICENSE](LICENSE).
