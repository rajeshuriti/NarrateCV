import React from 'react';
import { Composition } from 'remotion';
import { NarrateVideo } from './NarrateVideo';
import type { VideoProps } from './types';

const FPS = 30;

// Default props used in Remotion Studio / dev mode
const defaultProps: VideoProps = {
  scenes: [
    {
      type: 'intro',
      text: 'Jane Doe\nSenior Software Engineer',
      duration: 4,
      audioUrl: '',
    },
    {
      type: 'skills',
      text: 'React, TypeScript, Node.js, Python, AWS, PostgreSQL',
      duration: 5,
      audioUrl: '',
    },
    {
      type: 'experience',
      text: 'Led platform team at Acme Corp. Built real-time data pipelines. Grew engineering org from 4 to 20.',
      duration: 6,
      audioUrl: '',
    },
    {
      type: 'impact',
      text: 'Reduced deployment time by 60%. Shipped $2M in new features. 99.9% uptime across production systems.',
      duration: 5,
      audioUrl: '',
    },
    {
      type: 'closing',
      text: "Ready to build something great together.",
      duration: 4,
      audioUrl: '',
    },
  ],
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="NarrateCV"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={NarrateVideo as React.ComponentType<any>}
      // calculateMetadata derives the real duration from the scenes prop
      calculateMetadata={({ props }: { props: unknown }) => {
        const total = (props as unknown as VideoProps).scenes.reduce(
          (acc, s) => acc + Math.round(s.duration * FPS),
          0,
        );
        return { durationInFrames: Math.max(total, FPS) };
      }}
      // Fallback used before calculateMetadata resolves
      durationInFrames={FPS * 24}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
    />
  );
};
