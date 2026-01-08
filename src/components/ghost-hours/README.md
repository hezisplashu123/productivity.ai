# Ghost Hours Calculator

This folder contains all components for the Ghost Hours calculation flow.

## Structure

```
ghost-hours/
├── README.md (this file)
├── types.ts - TypeScript interfaces and types
├── constants.ts - Constants, themes, and utility functions
├── GhostHoursCalculator.tsx - Main calculator component (orchestrates all screens)
├── index.ts - Public exports
└── screens/
    ├── Screen1Mystery.tsx - "Imagine if you could finish an 8-hour workday..." screen
    ├── Screen2Villain.tsx - "The enemy isn't laziness. It's the Switch Tax." screen
    ├── Screen3Input.tsx - Input screen with sliders for hours and distraction level
    └── Screen4Verdict.tsx - Results screen showing calculated ghost hours
```

## Screen Descriptions

- **Screen1Mystery**: The hook screen that introduces the concept with a visualization
- **Screen2Villain**: Explains the "Switch Tax" concept
- **Screen3Input**: User inputs their work hours and distraction level
- **Screen4Verdict**: Shows the calculated ghost hours with animated results

