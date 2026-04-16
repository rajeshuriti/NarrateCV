import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  text: string;
}

export const SkillsGrid: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const skills = text.split(',').map(s => s.trim());

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 100px',
      background: '#0a0a14',
    }}>
      <h2 style={{
        fontSize: '64px',
        color: '#8b5cf6',
        marginBottom: '60px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '4px',
        opacity: spring({ frame, fps }),
      }}>
        Core Competencies
      </h2>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '30px',
        width: '100%',
        maxWidth: '1400px',
      }}>
        {skills.map((skill, i) => {
          const cardSpring = spring({
            frame: frame - (i * 3) - 15,
            fps,
            config: { damping: 12 },
          });

          return (
            <div key={i} style={{
              padding: '25px 50px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(217, 70, 239, 0.1) 100%)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              fontSize: '42px',
              fontWeight: '600',
              color: 'white',
              opacity: cardSpring,
              transform: `scale(${interpolate(cardSpring, [0, 1], [0.8, 1])}) translateY(${interpolate(cardSpring, [0, 1], [30, 0])}px)`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}>
              {skill}
            </div>
          );
        })}
      </div>
    </div>
  );
};
