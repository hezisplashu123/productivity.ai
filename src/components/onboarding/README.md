# Onboarding Wizard

This folder contains all components for the onboarding flow.

## Structure

```
onboarding/
├── README.md (this file)
├── types.ts - TypeScript interfaces (OnboardingData, etc.)
├── constants.ts - Data constants (WORK_ARCHETYPES, FRICTION_TYPES, etc.)
├── OnboardingWizard.tsx - Main wizard component (orchestrates all steps)
├── index.ts - Public exports
└── steps/
    ├── Step0CognitiveTriggers.tsx - "Lies we tell ourselves" - Cognitive triggers selection
    ├── Step1Distractions.tsx - "Where does your time go?" - Distraction selection
    ├── Step2FocusWindow.tsx - "When is your brain actually awake?" - Focus window selection
    ├── Step3WorkArchetype.tsx - "How do you currently work?" - Work archetype selection
    └── Step4ProductivityKillers.tsx - "What kills your productivity?" - Multi-select friction types
```

## Step Descriptions

- **Step 0 - Cognitive Triggers**: User selects their main cognitive trigger (lies they tell themselves)
- **Step 1 - Distractions**: User selects their primary distraction
- **Step 2 - Focus Window**: User selects when they're most productive (Early Bird, Mid-Day, Night Owl)
- **Step 3 - Work Archetype**: User selects their work style (Firefighter, Over-Planner, Juggler, Sprinter)
- **Step 4 - Productivity Killers**: User selects all productivity killers that apply (multi-select)

