export interface Manual {
  id: string
  title: string
  category: string
  content: string
  embedding?: number[]
  created_at: string
  updated_at: string
}

export interface Scenario {
  id: string
  title: string
  description: string
  related_manual_id?: string
  created_at: string
  updated_at: string
}

export interface Scene {
  id: string
  title: string
  description: string
  edge_function: string
  icon?: string
  created_at: string
  updated_at: string
}

export interface EvaluationCriterion {
  id: string
  label: string
  description: string
  max_score: number
  created_at: string
  updated_at: string
}

export interface Recording {
  id: string
  scenario_id?: string
  situation_id?: string
  audio_url: string
  transcript?: string
  created_at: string
}

export interface Evaluation {
  id: string
  recording_id: string
  total_score: number
  summary_comment: string
  created_at: string
}

export interface FeedbackNote {
  id: string
  evaluation_id: string
  criterion_id: string
  score: number
  comment: string
  created_at: string
}

export interface ReflectionNote {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface PracticePlan {
  id: string
  user_id: string
  date: string
  scene_id: string
  note?: string
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      manuals: {
        Row: Manual
        Insert: Omit<Manual, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Manual, 'id' | 'created_at' | 'updated_at'>>
      }
      scenarios: {
        Row: Scenario
        Insert: Omit<Scenario, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Scenario, 'id' | 'created_at' | 'updated_at'>>
      }
      scenes: {
        Row: Scene
        Insert: Omit<Scene, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Scene, 'id' | 'created_at' | 'updated_at'>>
      }
      evaluation_criteria: {
        Row: EvaluationCriterion
        Insert: Omit<EvaluationCriterion, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EvaluationCriterion, 'id' | 'created_at' | 'updated_at'>>
      }
      recordings: {
        Row: Recording
        Insert: Omit<Recording, 'id' | 'created_at'>
        Update: Partial<Omit<Recording, 'id' | 'created_at'>>
      }
      evaluations: {
        Row: Evaluation
        Insert: Omit<Evaluation, 'id' | 'created_at'>
        Update: Partial<Omit<Evaluation, 'id' | 'created_at'>>
      }
      feedback_notes: {
        Row: FeedbackNote
        Insert: Omit<FeedbackNote, 'id' | 'created_at'>
        Update: Partial<Omit<FeedbackNote, 'id' | 'created_at'>>
      }
      reflection_notes: {
        Row: ReflectionNote
        Insert: Omit<ReflectionNote, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ReflectionNote, 'id' | 'created_at' | 'updated_at'>>
      }
      practice_plans: {
        Row: PracticePlan
        Insert: Omit<PracticePlan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PracticePlan, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}