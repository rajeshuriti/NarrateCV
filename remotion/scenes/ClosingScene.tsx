import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { Img } from 'remotion';

interface Props {
  text: string;
  photoUrl?: string;
}

export const ClosingScene: React.FC<Props> = ({ text, photoUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 100px',
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a14 100%)',
    }}>
      {photoUrl && (
        <div style={{
          width: '240px',
          height: '240px',
          borderRadius: '120px',
          border: '4px solid #8b5cf6',
          overflow: 'hidden',
          marginBottom: '40px',
          opacity: entrance,
          transform: `scale(${interpolate(entrance, [0, 1], [0.8, 1])})`,
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
        }}>
          <Img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{
        textAlign: 'center',
        opacity: entrance,
        transform: `translateY(${interpolate(entrance, [0, 1], [20, 0])}px)`,
      }}>
        <p style={{
          fontSize: '64px',
          fontWeight: '800',
          color: 'white',
          lineHeight: 1.2,
          margin: 0,
          maxWidth: '1200px',
        }}>
          {text}
        </p>

        {/* CTA Button placeholder */}
        <div style={{
          marginTop: '60px',
          padding: '30px 80px',
          background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
          color: 'white',
          fontSize: '32px',
          fontWeight: '700',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(139, 92, 246, 0.4)',
          display: 'inline-block',
        }}>
          Let's Connect
        </div>
      </div>
    </div>
  );
};
