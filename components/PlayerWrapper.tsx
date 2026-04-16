'use client';

/**
 * Thin wrapper around Remotion <Player> so it can be dynamically imported
 * with ssr:false from the preview page.
 */

import React from 'react';
import { Player } from '@remotion/player';
import { NarrateVideo } from '@/remotion/NarrateVideo';
import type { Scene, CandidateInfo } from '@/remotion/types';

interface Props {
  scenes: Scene[];
  durationInFrames: number;
  photoUrl?: string;
  candidate: CandidateInfo;
}

export default function PlayerWrapper({ scenes, durationInFrames, photoUrl, candidate }: Props) {
  return (
    <Player
      component={NarrateVideo}
      inputProps={{ scenes, photoUrl, candidate }}
      durationInFrames={Math.max(durationInFrames, 1)}
      compositionWidth={1920}
      compositionHeight={1080}
      fps={30}
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
      }}
      controls
      autoPlay
      loop
    />
  );
}
