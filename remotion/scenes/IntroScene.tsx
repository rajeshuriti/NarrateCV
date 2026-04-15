import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  text: string;
}

// Bold name + title card with staggered entrance animation
export const IntroScene: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Split text into first line (name) and rest
  const lines = text.split('\n').filter(Boolean);
  const name = lines[0] ?? text;
  const subtitle = lines.slice(1).join(' · ') || 'Professional Profile';

  const nameOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const nameY = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: 'clamp' });

  const subOpacity = spring({ frame: frame - 12, fps, from: 0, to: 1, durationInFrames: 20 });
  const subY = interpolate(frame, [12, 32], [30, 0], { extrapolateRight: 'clamp' });

  const lineScale = spring({ frame: frame - 8, fps, from: 0, to: 1, durationInFrames: 18 });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a14 0%, #12121f 60%, #1a0a2e 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '80px',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Accent orb */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* NarrateCV tag */}
      <div
        style={{
          opacity: subOpacity,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
        <span style={{ color: '#6366f1', fontSize: 22, fontWeight: 600, letterSpacing: 3 }}>
          NARRATECV
        </span>
      </div>

      {/* Name */}
      <h1
        style={{
          color: '#ffffff',
          fontSize: 96,
          fontWeight: 800,
          margin: 0,
          letterSpacing: -2,
          opacity: nameOpacity,
          transform: `translateY(${nameY}px)`,
          textAlign: 'center',
        }}
      >
        {name}
      </h1>

      {/* Accent divider */}
      <div
        style={{
          marginTop: 24,
          height: 4,
          width: 120 * lineScale,
          background: 'linear-gradient(90deg, #6366f1, #a5b4fc)',
          borderRadius: 2,
        }}
      />

      {/* Subtitle */}
      <p
        style={{
          color: '#a5b4fc',
          fontSize: 32,
          fontWeight: 400,
          marginTop: 24,
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          textAlign: 'center',
          letterSpacing: 1,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
};
