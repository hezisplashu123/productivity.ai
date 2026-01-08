import { Goal, Task } from '../types';

export const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Launch my dropshipping store',
    createdAt: new Date(),
    status: 'active',
  },
];

export const mockTasks: Task[] = [
  {
    id: '1',
    goalId: '1',
    title: 'Deep Work - Project Alpha',
    description: 'Research profitable niches',
    duration: 90,
    status: 'queued',
    order: 0,
    completed: false,
    subTasks: [
      { id: '1-1', title: 'Use Google Trends', completed: false, duration: 30 },
      { id: '1-2', title: 'Analyze competitor stores', completed: false, duration: 45 },
      { id: '1-3', title: 'Check supplier availability', completed: false, duration: 15 },
    ],
  },
  {
    id: '2',
    goalId: '1',
    title: 'Set up Shopify store',
    description: 'Create account, choose theme, configure basic settings',
    duration: 45,
    status: 'queued',
    order: 1,
    completed: false,
  },
  {
    id: '3',
    goalId: '1',
    title: 'Find and vet suppliers',
    description: 'Contact suppliers, request samples, negotiate terms',
    duration: 120,
    status: 'queued',
    order: 2,
    completed: false,
  },
  {
    id: '4',
    goalId: '1',
    title: 'Create product listings',
    description: 'Write descriptions, take/edit photos, set prices',
    duration: 30,
    status: 'queued',
    order: 3,
    completed: false,
  },
  {
    id: '5',
    goalId: '1',
    title: 'Set up payment and shipping',
    description: 'Configure payment gateways and shipping options',
    duration: 20,
    status: 'queued',
    order: 4,
    completed: false,
  },
];




