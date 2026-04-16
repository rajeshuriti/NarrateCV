import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  text: string;
}

export const StrengthsScene: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const strengths = text.split(',').map(s => s.trim());

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 100px',
      background: 'linear-gradient(45deg, #0a0a14 0%, #2e1065 100%)',
    }}>
      <h2 style={{
        fontSize: '72px',
        color: '#a78bfa',
        marginBottom: '60px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '6px',
        opacity: spring({ frame, fps }),
      }}>
        Professional Strengths
      </h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        alignItems: 'center',
      }}>
        {strengths.map((str, i) => {
          const strSpring = spring({
            frame: frame - (i * 8) - 15,
            fps,
            config: { damping: 12 },
          });

          return (
            <div key={i} style={{
              fontSize: '64px',
              fontWeight: '700',
              color: 'white',
              opacity: strSpring,
              transform: `scale(${interpolate(strSpring, [0, 1], [0.8, 1])})`,
              textShadow: '0 0 20px rgba(167, 139, 250, 0.4)',
              background: 'rgba(255,255,255,0.05)',
              padding: '20px 80px',
              borderRadius: '100px',
              border: '1px solid rgba(167, 139, 250, 0.2)',
            }}>
              {str}
            </div>
          );
        })}
      </div>
    </div>
  );
};
