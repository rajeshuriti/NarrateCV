import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  text: string;
}

export const SummaryScene: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance
  const entrance = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const words = text.split(' ');

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
        padding: '60px',
        borderLeft: '4px solid #8b5cf6',
        borderRight: '4px solid #d946ef',
        background: 'rgba(139, 92, 246, 0.05)',
        borderRadius: '40px',
        opacity: entrance,
        transform: `scale(${interpolate(entrance, [0, 1], [0.95, 1])})`,
      }}>
        <p style={{
          fontSize: '56px',
          fontWeight: '500',
          color: '#e2e8f0',
          lineHeight: 1.5,
          margin: 0,
          textAlign: 'center',
        }}>
          {words.map((word, i) => {
            const wordSpring = spring({
              frame: frame - (i * 1.5) - 20,
              fps,
              config: { damping: 15 },
            });

            return (
              <span key={i} style={{
                display: 'inline-block',
                marginRight: '15px',
                opacity: wordSpring,
                transform: `translateY(${interpolate(wordSpring, [0, 1], [20, 0])}px)`,
              }}>
                {word}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
};
