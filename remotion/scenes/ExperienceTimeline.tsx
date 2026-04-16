import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  title?: string;
  subtitle?: string;
  text: string;
}

export const ExperienceTimeline: React.FC<Props> = ({ title, subtitle, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps });
  const contentEntrance = spring({ frame: frame - 15, fps });

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '0 150px',
      background: '#0a0a14',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '30px',
        opacity: entrance,
        transform: `translateY(${interpolate(entrance, [0, 1], [30, 0])}px)`,
      }}>
        <h2 style={{
          fontSize: '72px',
          fontWeight: '900',
          color: 'white',
          margin: 0,
        }}>
          {title || 'Professional Experience'}
        </h2>
        <span style={{
          fontSize: '36px',
          color: '#8b5cf6',
          fontWeight: '600',
        }}>
          {subtitle}
        </span>
      </div>

      {/* Timeline line */}
      <div style={{
        width: interpolate(entrance, [0, 1], [0, 1000]),
        height: '4px',
        background: 'linear-gradient(90deg, #8b5cf6, transparent)',
        margin: '40px 0 60px 0',
      }} />

      <div style={{
        padding: '60px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '30px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        width: '100%',
        maxWidth: '1200px',
        opacity: contentEntrance,
        transform: `translateY(${interpolate(contentEntrance, [0, 1], [40, 0])}px)`,
      }}>
        <p style={{
          fontSize: '48px',
          lineHeight: 1.6,
          color: '#cbd5e1',
          margin: 0,
          fontWeight: '400',
        }}>
          {text}
        </p>
      </div>
    </div>
  );
};
