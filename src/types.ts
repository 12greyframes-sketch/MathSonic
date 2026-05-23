export type Topic = 'addition' | 'subtraction' | 'percentages' | 'ratio' | 'squares_cubes_roots';

export type AnsweringMode = 'choice' | 'type';

export interface MathQuestion {
  id: string;
  text: string;
  subText?: string;
  topic: Topic;
  correctAnswer: string;
  choices: string[];
  hint?: string;
}

export interface GameConfig {
  topics: Topic[];
  answeringMode: AnsweringMode;
  timerDuration: number; // usually 30 seconds
}

export interface RoundStats {
  round: number;
  correctCount: number;
  incorrectCount: number;
  totalAnswered: number;
  score: number;
  unlockedNext: boolean;
  timestamp: string;
}

export type GamePhase = 'menu' | 'countdown' | 'playing' | 'round_end';

export interface HistoryItem {
  timestamp: string;
  round: number;
  correct: number;
  total: number;
  percentage: number;
  topics: Topic[];
}
