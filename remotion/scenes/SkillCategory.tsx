import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  title?: string;
  text: string;
}

export const SkillCategory: React.FC<Props> = ({ title, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const skills = text.split(',').map(s => s.trim());

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '0 150px',
      background: 'linear-gradient(90deg, #0a0a14 0%, #1a1a2e 100%)',
    }}>
      <h2 style={{
        fontSize: '80px',
        color: 'white',
        marginBottom: '20px',
        fontWeight: '900',
        opacity: spring({ frame, fps }),
        transform: `translateX(${interpolate(spring({ frame, fps }), [0, 1], [-50, 0])}px)`,
      }}>
        {title || 'Specialization'}
      </h2>
      
      <div style={{
        width: interpolate(spring({ frame: frame - 10, fps }), [0, 1], [0, 600]),
        height: '8px',
        background: '#8b5cf6',
        borderRadius: '4px',
        marginBottom: '60px',
      }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        width: '100%',
      }}>
        {skills.map((skill, i) => {
          const itemSpring = spring({
            frame: frame - (i * 4) - 25,
            fps,
            config: { damping: 12 },
          });

          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '25px',
              opacity: itemSpring,
              transform: `translateX(${interpolate(itemSpring, [0, 1], [40, 0])}px)`,
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '8px',
                background: '#8b5cf6',
                boxShadow: '0 0 15px #8b5cf6',
              }} />
              <span style={{
                fontSize: '48px',
                fontWeight: '600',
                color: '#e2e8f0',
              }}>
                {skill}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
