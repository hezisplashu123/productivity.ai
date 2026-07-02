export interface QuestionPrompt {
  id: string;
  text: string;
  category: string;
  tags: string[];
}

export interface UserProfile {
  id: string;
  userId: string;
  vibeWeights: Record<string, number>;
  ageRange?: string;
}

export interface SwipableCardData {
  id: string;
  label: string;
  description?: string;
  category?: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  profileId?: string;
  ageRange?: string;
}

export type Gamemode = 'friendship' | 'relationship' | 'family';