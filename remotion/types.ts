// Shared types used across Remotion compositions and the rest of the app

export interface Scene {
  type: 'intro' | 'skills' | 'experience' | 'project' | 'impact' | 'closing';
  text: string;
  duration: number; // seconds
  audioUrl?: string;
  usePhoto?: boolean;
}

export interface VideoProps {
  scenes: Scene[];
  photoUrl?: string;
}
