// Shared types used across Remotion compositions and the rest of the app

export interface Scene {
  type: 'intro' | 'skills' | 'experience' | 'impact' | 'closing';
  text: string;
  duration: number; // seconds
  audioUrl?: string;
}

export interface VideoProps {
  scenes: Scene[];
}
