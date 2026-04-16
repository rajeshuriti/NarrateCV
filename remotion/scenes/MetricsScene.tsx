import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  text: string;
}

export const MetricsScene: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const metrics = text.split('.').filter(m => m.trim().length > 0);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 100px',
      background: 'radial-gradient(circle at center, #1e1b4b 0%, #0a0a14 100%)',
    }}>
      <h2 style={{
        fontSize: '72px',
        color: '#fbbf24',
        marginBottom: '80px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '8px',
        opacity: spring({ frame, fps }),
      }}>
        Impact & Results
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: metrics.length > 2 ? '1fr 1fr' : '1fr',
        gap: '60px',
        width: '100%',
        maxWidth: '1500px',
      }}>
        {metrics.map((metric, i) => {
          const metricSpring = spring({
            frame: frame - (i * 10) - 20,
            fps,
            config: { damping: 10 },
          });

          return (
            <div key={i} style={{
              padding: '60px',
              background: 'rgba(251, 191, 36, 0.05)',
              border: '2px dashed #fbbf24',
              borderRadius: '40px',
              opacity: metricSpring,
              transform: `translateY(${interpolate(metricSpring, [0, 1], [60, 0])}px)`,
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: '52px',
                fontWeight: '700',
                color: 'white',
                lineHeight: 1.3,
                margin: 0,
              }}>
                {metric.trim()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
