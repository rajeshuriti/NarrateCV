import React from 'react';
import { Composition } from 'remotion';
import { NarrateVideo } from './NarrateVideo';
import type { VideoProps } from './types';

const FPS = 30;

// Default props for the cinematic 120s video
const defaultProps: VideoProps = {
  candidate: {
    name: 'Jane Doe',
    headline: 'Senior Full Stack Engineer',
    yearsExperience: '8+',
    location: 'San Francisco, CA',
  },
  photoUrl: '',
  scenes: [
    {
      type: 'intro-hero',
      title: 'Jane Doe',
      subtitle: 'Senior Full Stack Engineer',
      text: 'Introducing Jane Doe, a Senior Full Stack Engineer with over eight years of experience building scalable web applications.',
      duration: 8,
      usePhoto: true,
      visual: 'hero',
    },
    {
      type: 'summary',
      text: 'Specializing in distributed systems and high-performance frontend architectures, Jane has a track record of leading technical initiatives.',
      duration: 10,
    },
    {
      type: 'skills-grid',
      text: 'React, TypeScript, Node.js, Go, AWS, Docker, Kubernetes, PostgreSQL',
      duration: 10,
    },
    {
      type: 'skill-category',
      title: 'Backend Expertise',
      text: 'Microservices, gRPC, Event-driven architecture, Scalable APIs',
      duration: 8,
    },
    {
      type: 'experience-timeline',
      title: 'Lead Engineer',
      subtitle: 'Tech Global (2020-2024)',
      text: 'Spearheaded the migration to a microservices architecture improving system availability to 99.99%.',
      duration: 12,
    },
    {
      type: 'project-showcase',
      title: 'CloudScale Optimizer',
      text: 'Developed an automated resource allocation engine that reduced AWS costs by 40% globally.',
      duration: 12,
    },
    {
      type: 'metrics',
      text: 'Reduced latency by 200%. Cut infrastructure costs by 40%. Led team of 15 engineers.',
      duration: 10,
    },
    {
      type: 'strengths',
      text: 'Systems Thinking, Technical Leadership, Product Ownership',
      duration: 8,
    },
    {
      type: 'career-goal',
      text: 'Building the future of decentralized computing and real-time collaboration tools.',
      duration: 8,
    },
    {
      type: 'closing',
      text: 'Let\'s collaborate on complex engineering challenges.',
      duration: 8,
      usePhoto: true,
    },
  ],
};

export const Root: React.FC = () => {
  return (
    <Composition
      id="NarrateCV"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={NarrateVideo as React.ComponentType<any>}
      calculateMetadata={({ props }: { props: unknown }) => {
        const total = (props as unknown as VideoProps).scenes.reduce(
          (acc, s) => acc + Math.round(s.duration * FPS),
          0,
        );
        return { durationInFrames: Math.max(total, FPS) };
      }}
      durationInFrames={FPS * 114} // Approx 114s
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
    />
  );
};
