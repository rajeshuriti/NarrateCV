import React from 'react';
import { Sequence, Audio, useVideoConfig } from 'remotion';
import type { VideoProps, Scene } from './types';

// Cinematic Scene Imports
import { IntroHero } from './scenes/IntroHero';
import { SummaryScene } from './scenes/SummaryScene';
import { SkillsGrid } from './scenes/SkillsGrid';
import { SkillCategory } from './scenes/SkillCategory';
import { ExperienceTimeline } from './scenes/ExperienceTimeline';
import { ProjectShowcase } from './scenes/ProjectShowcase';
import { MetricsScene } from './scenes/MetricsScene';
import { StrengthsScene } from './scenes/StrengthsScene';
import { CareerGoal } from './scenes/CareerGoal';
import { ClosingScene } from './scenes/ClosingScene';

// Background music placeholder - recommend a subtle ambient track
const BACKGROUND_MUSIC_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3';

function SceneComponent({ 
  scene, 
  photoUrl, 
  candidate 
}: { 
  scene: Scene; 
  photoUrl?: string;
  candidate?: VideoProps['candidate'];
}) {
  const photo = scene.usePhoto ? photoUrl : undefined;

  switch (scene.type) {
    case 'intro-hero':
      return (
        <IntroHero 
          title={scene.title || candidate?.name || ''} 
          subtitle={scene.subtitle || candidate?.headline || ''} 
          photoUrl={photo} 
        />
      );
    case 'summary':
      return <SummaryScene text={scene.text} />;
    case 'skills-grid':
      return <SkillsGrid text={scene.text} />;
    case 'skill-category':
      return <SkillCategory title={scene.title} text={scene.text} />;
    case 'experience-timeline':
      return (
        <ExperienceTimeline 
          title={scene.title} 
          subtitle={scene.subtitle} 
          text={scene.text} 
        />
      );
    case 'project-showcase':
      return <ProjectShowcase title={scene.title} text={scene.text} />;
    case 'metrics':
      return <MetricsScene text={scene.text} />;
    case 'strengths':
      return <StrengthsScene text={scene.text} />;
    case 'career-goal':
      return <CareerGoal text={scene.text} />;
    case 'closing':
      return <ClosingScene text={scene.text} photoUrl={photo} />;
    default:
      return <SummaryScene text={scene.text} />;
  }
}

export const NarrateVideo: React.FC<VideoProps> = ({ candidate, scenes, photoUrl }) => {
  const { fps } = useVideoConfig();

  // Dynamic timeline builder
  let cursor = 0;
  const sequencedScenes = scenes.map((scene) => {
    const from = cursor;
    const durationInFrames = Math.round(scene.duration * fps);
    cursor += durationInFrames;
    return { scene, from, durationInFrames };
  });

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a14' }}>
      {/* Cinematic Background Music */}
      <Audio
        src={BACKGROUND_MUSIC_URL}
        volume={0.15} // Low volume for professional feel
        loop
      />

      {sequencedScenes.map(({ scene, from, durationInFrames }, i) => (
        <Sequence key={i} from={from} durationInFrames={durationInFrames}>
          {/* Voice-over audio for THIS specific scene */}
          {scene.audioUrl && (
            <Audio
              src={scene.audioUrl}
              startFrom={0}
              volume={1.0}
            />
          )}
          
          {/* Visual Layer */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <SceneComponent 
              scene={scene} 
              photoUrl={photoUrl} 
              candidate={candidate} 
            />
          </div>
        </Sequence>
      ))}
    </div>
  );
};
