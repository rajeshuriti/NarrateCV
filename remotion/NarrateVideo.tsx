import React from 'react';
import { Sequence, Audio, useVideoConfig } from 'remotion';
import type { VideoProps, Scene } from './types';
import { IntroScene } from './scenes/IntroScene';
import { SkillsScene } from './scenes/SkillsScene';
import { ExperienceScene } from './scenes/ExperienceScene';
import { ProjectScene } from './scenes/ProjectScene';
import { ImpactScene } from './scenes/ImpactScene';
import { ClosingScene } from './scenes/ClosingScene';

// Maps scene type → the correct animated component
function SceneComponent({ scene, photoUrl }: { scene: Scene; photoUrl?: string }) {
  const photo = scene.usePhoto ? photoUrl : undefined;

  switch (scene.type) {
    case 'intro':
      return <IntroScene text={scene.text} photoUrl={photo} />;
    case 'skills':
      return <SkillsScene text={scene.text} />;
    case 'experience':
      return <ExperienceScene text={scene.text} />;
    case 'project':
      return <ProjectScene text={scene.text} />;
    case 'impact':
      return <ImpactScene text={scene.text} />;
    case 'closing':
      return <ClosingScene text={scene.text} photoUrl={photo} />;
    default:
      return <ClosingScene text={scene.text} />;
  }
}

export const NarrateVideo: React.FC<VideoProps> = ({ scenes, photoUrl }) => {
  const { fps } = useVideoConfig();

  // Build cumulative start frames for each scene
  let cursor = 0;
  const sequencedScenes = scenes.map((scene) => {
    const from = cursor;
    const durationInFrames = Math.round(scene.duration * fps);
    cursor += durationInFrames;
    return { scene, from, durationInFrames };
  });

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a14' }}>
      {sequencedScenes.map(({ scene, from, durationInFrames }, i) => (
        <Sequence key={i} from={from} durationInFrames={durationInFrames}>
          {/* Voice-over audio for this scene — only rendered when audioUrl is present */}
          {scene.audioUrl && (
            <Audio
              src={scene.audioUrl}
              startFrom={0}
            />
          )}
          {/* Full-frame scene visual */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <SceneComponent scene={scene} photoUrl={photoUrl} />
          </div>
        </Sequence>
      ))}
    </div>
  );
};
