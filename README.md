# Productivity AI - Goal-to-Action App

A beautiful, animated React Native productivity app built with Expo SDK 54. Transform high-level goals into actionable tasks with AI-powered breakdowns and productivity tracking.

## Features

- 🎯 **Goal Ingestion**: Enter your main goal and watch it transform into actionable tasks
- 📋 **Action Plan Dashboard**: View tasks in a beautiful timeline with progress tracking
- ✨ **Swipe-to-Complete**: Intuitive gesture-based task completion
- 🎊 **Productivity Reflection**: Rate your productivity after each task with confetti celebrations
- 🌟 **Smooth Animations**: Powered by React Native Reanimated 3 and Moti
- 🎨 **Modern UI**: Dark theme with starry background, matching the QUITTR aesthetic

## Tech Stack

- **Expo SDK 54** with TypeScript
- **Expo Router** for navigation
- **React Native Reanimated 3** for animations
- **Moti** for declarative animations
- **React Native Gesture Handler** for swipe gestures
- **Lucide React Native** for icons
- **React Native Confetti Cannon** for celebrations

## Getting Started

### Prerequisites

- Node.js (v18+)
- Expo Go app on your phone
- Your phone and computer on the same WiFi network

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

Scan the QR code with Expo Go to run the app on your device.

## Project Structure

```
productivity.ai/
├── app/
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Goal ingestion screen (Home)
│   └── action-plan.tsx      # Action plan dashboard
├── src/
│   ├── components/
│   │   ├── GoalCard.tsx     # Goal display card
│   │   ├── TaskCard.tsx     # Swipeable task card
│   │   ├── ProgressBar.tsx  # Animated progress indicator
│   │   ├── ReflectionModal.tsx  # Productivity rating modal
│   │   └── StarBackground.tsx   # Animated starry background
│   ├── context/
│   │   └── AppContext.tsx   # Global app state
│   ├── data/
│   │   └── mockData.ts      # Sample goals and tasks
│   └── types/
│       └── index.ts         # TypeScript type definitions
└── backend/                 # Express backend (separate)
```

## Usage

1. **Enter Your Goal**: On the home screen, type your main goal (e.g., "Launch my dropshipping store")
2. **AI Breakdown**: The app simulates AI processing and generates actionable tasks
3. **Complete Tasks**: Swipe right on any task card to mark it as complete
4. **Rate Productivity**: After completing a task, rate how productive you felt (1-5)
5. **Track Progress**: Watch your progress bar fill up as you complete tasks

## Key Components

### Goal Ingestion Screen
- Large, glowing input field
- Loading animation during AI processing
- Smooth transitions to action plan

### Action Plan Screen
- Progress bar showing completion percentage
- Swipeable task cards with expandable details
- Time budget badges for each task
- Empty state when all tasks are complete

### Reflection Modal
- 5-emoji rating system
- Confetti celebration for high ratings (4-5)
- Encouraging feedback messages
- Smooth modal animations

## Customization

### Colors
The app uses a dark theme with purple accents. Main colors:
- Background: `#0A0A0A`
- Primary: `#6366F1` (Indigo)
- Text: `#FFFFFF` (White)
- Secondary Text: `#A0A0A0` (Gray)

### Animations
All animations use React Native Reanimated 3 with spring physics for natural movement.

## Development

### Adding New Features

1. **New Screen**: Create a new file in `app/` directory
2. **New Component**: Add to `src/components/`
3. **State Management**: Use `AppContext` for global state
4. **Types**: Add to `src/types/index.ts`

### Testing Animations

Animations are optimized for 60fps. Use React Native Debugger or Flipper to monitor performance.

## Notes

- The app currently uses mock data for tasks. Connect to your backend API to fetch real AI-generated tasks.
- Confetti celebrations require `react-native-confetti-cannon` which may need native configuration for production builds.
- All animations are designed to feel premium and satisfying.

## License

MIT
