// Shared types used across Remotion compositions and the rest of the app

export type SceneType =
  | 'intro-hero'
  | 'summary'
  | 'skills-grid'
  | 'skill-category'
  | 'experience-timeline'
  | 'project-showcase'
  | 'metrics'
  | 'strengths'
  | 'career-goal'
  | 'closing';

export interface Scene {
  type: SceneType;
  title?: string;
  subtitle?: string;
  text: string;
  duration: number; // seconds
  audioUrl?: string;
  usePhoto?: boolean;
  visual?: 'hero' | 'grid' | 'list' | 'vertical' | 'accent';
}

export interface CandidateInfo {
  name: string;
  headline: string;
  yearsExperience?: string;
  location?: string;
}

export interface VideoProps {
  candidate: CandidateInfo;
  scenes: Scene[];
  photoUrl?: string;
  videoMeta?: {
    targetDurationSeconds: number;
  };
}
