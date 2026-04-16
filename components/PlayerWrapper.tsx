'use client';

/**
 * Thin wrapper around Remotion <Player> so it can be dynamically imported
 * with ssr:false from the preview page.  Remotion Player relies on browser
 * APIs (requestAnimationFrame, Web Audio) that don't exist in Node.
 */

import React from 'react';
import { Player } from '@remotion/player';
import { NarrateVideo } from '@/remotion/NarrateVideo';
import type { Scene } from '@/remotion/types';

interface Props {
  scenes: Scene[];
  durationInFrames: number;
  photoUrl?: string;
}

export default function PlayerWrapper({ scenes, durationInFrames, photoUrl }: Props) {
  return (
    <Player
      component={NarrateVideo}
      inputProps={{ scenes, photoUrl }}
      durationInFrames={Math.max(durationInFrames, 1)}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      style={{
        width: '100%',
        // Maintain 16:9 aspect ratio
        aspectRatio: '16 / 9',
      }}
      controls
      // Auto-play so users immediately see it working
      autoPlay
      loop
    />
  );
}
