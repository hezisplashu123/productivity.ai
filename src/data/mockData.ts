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
    title: 'Research profitable niches',
    description: 'Identify 3-5 high-demand, low-competition niches',
    timeBudget: 120,
    completed: false,
    subTasks: [
      { id: '1-1', title: 'Use Google Trends', completed: false },
      { id: '1-2', title: 'Analyze competitor stores', completed: false },
      { id: '1-3', title: 'Check supplier availability', completed: false },
    ],
  },
  {
    id: '2',
    goalId: '1',
    title: 'Set up Shopify store',
    description: 'Create account, choose theme, configure basic settings',
    timeBudget: 90,
    completed: false,
  },
  {
    id: '3',
    goalId: '1',
    title: 'Find and vet suppliers',
    description: 'Contact suppliers, request samples, negotiate terms',
    timeBudget: 180,
    completed: false,
  },
  {
    id: '4',
    goalId: '1',
    title: 'Create product listings',
    description: 'Write descriptions, take/edit photos, set prices',
    timeBudget: 60,
    completed: false,
  },
  {
    id: '5',
    goalId: '1',
    title: 'Set up payment and shipping',
    description: 'Configure payment gateways and shipping options',
    timeBudget: 45,
    completed: false,
  },
];


