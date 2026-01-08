import { TimeBlock } from '../types';

export interface TimeBlockConfig {
  id: TimeBlock;
  emoji: string;
  name: string;
  description: string;
  startHour: number; // 0-23
  endHour: number; // 0-23
  focus: 'high' | 'medium' | 'low';
  workType: 'deep' | 'shallow' | 'planning' | 'flexible';
}

export const TIME_BLOCKS: Record<TimeBlock, TimeBlockConfig> = {
  morning: {
    id: 'morning',
    emoji: '🌅',
    name: 'Morning Flow',
    description: 'High Focus / Deep Work',
    startHour: 8,
    endHour: 12,
    focus: 'high',
    workType: 'deep',
  },
  afternoon: {
    id: 'afternoon',
    emoji: '☀️',
    name: 'Afternoon Push',
    description: 'Admin / Meetings / Shallow Work',
    startHour: 13,
    endHour: 17,
    focus: 'medium',
    workType: 'shallow',
  },
  evening: {
    id: 'evening',
    emoji: '🌇',
    name: 'Evening Wrap',
    description: 'Planning / Low Energy',
    startHour: 17,
    endHour: 20,
    focus: 'low',
    workType: 'planning',
  },
  anytime: {
    id: 'anytime',
    emoji: '🧠',
    name: 'Anytime',
    description: 'The Backlog',
    startHour: 0,
    endHour: 23,
    focus: 'medium',
    workType: 'flexible',
  },
};

export const TIME_BLOCK_ORDER: TimeBlock[] = ['morning', 'afternoon', 'evening', 'anytime'];









