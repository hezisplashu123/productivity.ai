# Habit Profiler

This folder contains all components for the habit profiler flow.

## Structure

```
habit-profiler/
├── README.md (this file)
├── types.ts - TypeScript interfaces (HabitProfileData, etc.)
├── constants.ts - Data constants (COGNITIVE_TRIGGERS, DISTRACTIONS, FOCUS_WINDOWS)
├── HabitProfiler.tsx - Main profiler component (orchestrates all steps)
├── index.ts - Public exports
└── steps/
    ├── Step1CognitiveTriggers.tsx - "The Lies We Tell Ourselves" - 2x2 grid selection
    ├── Step2Distractions.tsx - "Where does your time go?" - Vertical pill selection
    └── Step3FocusWindow.tsx - "When is your brain actually awake?" - Time window cards
```

## Step Descriptions

- **Step 1 - Cognitive Triggers**: User selects from a 2x2 grid of cognitive triggers (lies they tell themselves)
- **Step 2 - Distractions**: User selects their primary distraction from vertical pill options
- **Step 3 - Focus Window**: User selects their focus window (Early Bird, Mid-Day Sprinter, Night Owl)

