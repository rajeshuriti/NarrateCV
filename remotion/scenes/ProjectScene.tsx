import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  text: string;
}

// Card-style project highlights with staggered entrance animations
export const ProjectScene: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Split text into project entries
  const projects = text
    .split(/[.\n]/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8)
    .slice(0, 3);

  const headerOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });

  // Gradient colors per card
  const cardGradients = [
    'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))',
    'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(139,92,246,0.06))',
    'linear-gradient(135deg, rgba(79,70,229,0.18), rgba(79,70,229,0.06))',
  ];

  const cardBorders = [
    'rgba(99,102,241,0.4)',
    'rgba(139,92,246,0.4)',
    'rgba(79,70,229,0.4)',
  ];

  const cardIcons = ['🚀', '⚡', '🔧'];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a14 0%, #12121f 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '80px',
      }}
    >
      {/* Section label */}
      <div style={{ opacity: headerOpacity, marginBottom: 56, textAlign: 'center' }}>
        <span style={{ color: '#6366f1', fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>
          KEY PROJECTS
        </span>
        <div
          style={{
            marginTop: 12,
            height: 2,
            width: 60,
            background: '#6366f1',
            margin: '12px auto 0',
            borderRadius: 1,
          }}
        />
      </div>

      {/* Project cards */}
      <div
        style={{
          display: 'flex',
          gap: 32,
          justifyContent: 'center',
          flexWrap: 'wrap',
          maxWidth: 1500,
        }}
      >
        {projects.map((project, i) => {
          const delay = 10 + i * 12;
          const cardOpacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 18 });
          const cardY = interpolate(frame - delay, [0, 18], [40, 0], { extrapolateRight: 'clamp' });
          const cardScale = spring({ frame: frame - delay, fps, from: 0.9, to: 1, durationInFrames: 18 });

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px) scale(${cardScale})`,
                background: cardGradients[i % cardGradients.length],
                border: `1.5px solid ${cardBorders[i % cardBorders.length]}`,
                borderRadius: 20,
                padding: '40px 44px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                minWidth: 320,
                maxWidth: 420,
                flex: 1,
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: 36 }}>{cardIcons[i % cardIcons.length]}</span>

              {/* Project description */}
              <p
                style={{
                  color: '#e0e7ff',
                  fontSize: 26,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {project}
              </p>
            </div>
          );
        })}
      </div>

      {/* Fallback: show full text if we couldn't extract projects */}
      {projects.length === 0 && (
        <p
          style={{
            color: '#a5b4fc',
            fontSize: 32,
            textAlign: 'center',
            maxWidth: 1000,
            lineHeight: 1.6,
            opacity: headerOpacity,
          }}
        >
          {text}
        </p>
      )}
    </div>
  );
};
