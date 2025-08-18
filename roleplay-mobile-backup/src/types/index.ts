export interface Scene {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'basic' | 'advanced' | 'special';
  difficulty: number;
}

export interface Recording {
  id: string;
  sceneId: string;
  audioUrl: string;
  transcript: string;
  createdAt: string;
  duration: number;
}

export interface Evaluation {
  id: string;
  recordingId: string;
  totalScore: number;
  summaryComment: string;
  criteriaScores: CriteriaScore[];
  sceneScores: SceneScore[];
  philosophyScores: PhilosophyScore[];
}

export interface CriteriaScore {
  id: string;
  label: string;
  description: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface SceneScore {
  id: string;
  criterionName: string;
  description: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface PhilosophyScore {
  id: string;
  code: 'vision' | 'mission' | 'purpose';
  label: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'admin';
  createdAt: string;
}
