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
}
