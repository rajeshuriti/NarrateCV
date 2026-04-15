import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  text: string;
}

// Timeline-style experience card animation
export const ExperienceScene: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Split text into bullet points for the timeline
  const lines = text
    .split(/[.\n]/)
    .map((l) => l.trim())
    .filter((l) => l.length > 8)
    .slice(0, 4);

  const headerOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });
  const lineProgress = interpolate(frame, [5, 35], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a14 0%, #12121f 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '80px 120px',
      }}
    >
      {/* Section label */}
      <div style={{ opacity: headerOpacity, marginBottom: 56 }}>
        <span style={{ color: '#6366f1', fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>
          EXPERIENCE
        </span>
        <div
          style={{
            marginTop: 12,
            height: 2,
            width: 60,
            background: '#6366f1',
            borderRadius: 1,
          }}
        />
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', gap: 0, width: '100%', maxWidth: 1400 }}>
        {/* Vertical timeline column: dot + line */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0, paddingTop: 8 }}>
          {lines.map((_, i) => (
            <React.Fragment key={i}>
              {/* Dot */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#6366f1',
                  border: '3px solid #0a0a14',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(99,102,241,0.6)',
                  zIndex: 1,
                }}
              />
              {/* Connector line between dots */}
              {i < lines.length - 1 && (
                <div
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 40,
                    background: 'linear-gradient(180deg, #6366f1, rgba(99,102,241,0.2))',
                    opacity: lineProgress,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Timeline text entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, flex: 1, paddingLeft: 32 }}>
          {lines.map((line, i) => {
            const delay = 10 + i * 12;
            const itemOpacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 18 });
            const itemX = interpolate(frame - delay, [0, 18], [-30, 0], { extrapolateRight: 'clamp' });

            return (
              <div
                key={i}
                style={{
                  opacity: itemOpacity,
                  transform: `translateX(${itemX}px)`,
                  paddingTop: 0,
                }}
              >
                <p
                  style={{
                    color: '#e0e7ff',
                    fontSize: 30,
                    margin: 0,
                    lineHeight: 1.5,
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  {line}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
