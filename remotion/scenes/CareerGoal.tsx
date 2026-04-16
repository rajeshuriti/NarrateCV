import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  text: string;
}

export const CareerGoal: React.FC<Props> = ({ text }) => {
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
      padding: '0 150px',
      background: '#0a0a14',
    }}>
      <div style={{
        textAlign: 'center',
        opacity: entrance,
        transform: `translateY(${interpolate(entrance, [0, 1], [40, 0])}px)`,
      }}>
        <h2 style={{
          fontSize: '64px',
          color: '#8b5cf6',
          marginBottom: '40px',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '4px',
        }}>
          The Next Chapter
        </h2>

        <div style={{
          fontSize: '64px',
          lineHeight: 1.3,
          color: 'white',
          fontWeight: '700',
          fontStyle: 'italic',
          background: 'rgba(139, 92, 246, 0.1)',
          padding: '60px',
          borderRadius: '40px',
          border: '2px solid rgba(139, 92, 246, 0.3)',
        }}>
          "{text}"
        </div>
      </div>
    </div>
  );
};
