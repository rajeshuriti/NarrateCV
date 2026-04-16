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

  const mainOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 20 });
  const mainY = interpolate(frame, [0, 20], [30, 0], { extrapolateRight: 'clamp' });

  const ctaOpacity = spring({ frame: frame - 20, fps, from: 0, to: 1, durationInFrames: 18 });
  const ctaScale = spring({ frame: frame - 20, fps, from: 0.8, to: 1, durationInFrames: 18 });

  const brandOpacity = spring({ frame: frame - 35, fps, from: 0, to: 1, durationInFrames: 15 });

  // Photo animations
  const photoOpacity = spring({ frame: frame - 5, fps, from: 0, to: 1, durationInFrames: 18 });
  const photoScale = spring({ frame: frame - 5, fps, from: 0.85, to: 1, durationInFrames: 20, config: { damping: 14 } });

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
        gap: 32,
      }}
    >
      {/* Accent orb */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Profile photo — elegant small avatar above the message */}
      {photoUrl && (
        <div
          style={{
            opacity: photoOpacity,
            transform: `scale(${photoScale})`,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid rgba(99,102,241,0.4)',
              boxShadow: '0 0 40px rgba(99,102,241,0.25)',
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

      {/* Main message */}
      <p
        style={{
          color: '#ffffff',
          fontSize: 52,
          fontWeight: 700,
          textAlign: 'center',
          maxWidth: 1000,
          lineHeight: 1.4,
          margin: 0,
          opacity: mainOpacity,
          transform: `translateY(${mainY}px)`,
          letterSpacing: -0.5,
        }}
      >
        {text}
      </p>

      {/* CTA pill */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          background: 'linear-gradient(90deg, #6366f1, #818cf8)',
          borderRadius: 50,
          padding: '20px 56px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 0 40px rgba(99,102,241,0.4)',
        }}
      >
        <span style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, letterSpacing: 0.5 }}>
          Let's Connect
        </span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 24 }}>→</span>
      </div>

      {/* NarrateCV brand watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          opacity: brandOpacity,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
        <span style={{ color: 'rgba(165,180,252,0.5)', fontSize: 18, fontWeight: 600, letterSpacing: 3 }}>
          NARRATECV
        </span>
      </div>
    </div>
  );
};
