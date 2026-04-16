import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { Img } from 'remotion';

interface Props {
  text: string;
  photoUrl?: string;
}

// Bold name + title card with staggered entrance animation
// When photoUrl is provided, shows circular photo on the left with name/title on the right.
// When absent, centered text layout.
export const IntroScene: React.FC<Props> = ({ text, photoUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = text.split('\n').filter(Boolean);
  const name = lines[0] ?? text;
  const subtitle = lines.slice(1).join(' · ') || 'Professional Profile';

  const nameOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const nameY = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: 'clamp' });

  const subOpacity = spring({ frame: frame - 12, fps, from: 0, to: 1, durationInFrames: 20 });
  const subY = interpolate(frame, [12, 32], [30, 0], { extrapolateRight: 'clamp' });

  const lineScale = spring({ frame: frame - 8, fps, from: 0, to: 1, durationInFrames: 18 });

  // Photo animations
  const photoScale = spring({ frame: frame - 4, fps, from: 0.7, to: 1, durationInFrames: 22, config: { damping: 12 } });
  const photoOpacity = spring({ frame: frame - 4, fps, from: 0, to: 1, durationInFrames: 18 });
  const photoX = interpolate(frame, [4, 26], [-60, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: photoUrl ? 'row' : 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: photoUrl ? 80 : 0,
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

      {/* Profile Photo */}
      {photoUrl && (
        <div
          style={{
            opacity: photoOpacity,
            transform: `scale(${photoScale}) translateX(${photoX}px)`,
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid rgba(99,102,241,0.5)',
              boxShadow: '0 0 60px rgba(99,102,241,0.3), 0 0 120px rgba(99,102,241,0.1)',
            }}
          >
            <Img
              src={photoUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        </div>
      )}

      {/* Text content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: photoUrl ? 'flex-start' : 'center',
          zIndex: 2,
        }}
      >
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
            fontSize: photoUrl ? 72 : 96,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -2,
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            textAlign: photoUrl ? 'left' : 'center',
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
            textAlign: photoUrl ? 'left' : 'center',
            letterSpacing: 1,
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
};
