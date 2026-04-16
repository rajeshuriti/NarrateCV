import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  title?: string;
  text: string;
}

export const ProjectShowcase: React.FC<Props> = ({ title, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps });

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 100px',
      background: 'linear-gradient(180deg, #0a0a14 0%, #1a1a2e 100%)',
    }}>
      <div style={{
        padding: '80px',
        background: 'rgba(139, 92, 246, 0.05)',
        border: '3px solid #8b5cf6',
        borderRadius: '50px',
        maxWidth: '1400px',
        opacity: entrance,
        transform: `scale(${interpolate(entrance, [0, 1], [0.9, 1])}) rotate(${interpolate(entrance, [0, 1], [-2, 0])}deg)`,
        boxShadow: '0 30px 100px rgba(0,0,0,0.6)',
      }}>
        <h2 style={{
          fontSize: '56px',
          color: '#d946ef',
          marginBottom: '30px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '4px',
          textAlign: 'center',
        }}>
          Featured Project
        </h2>
        
        <h3 style={{
          fontSize: '84px',
          color: 'white',
          marginBottom: '50px',
          fontWeight: '900',
          textAlign: 'center',
          lineHeight: 1.1,
        }}>
          {title || 'Innovation Showcase'}
        </h3>

        <p style={{
          fontSize: '48px',
          lineHeight: 1.4,
          color: '#e2e8f0',
          margin: 0,
          textAlign: 'center',
          fontWeight: '500',
        }}>
          {text}
        </p>
      </div>
    </div>
  );
};
