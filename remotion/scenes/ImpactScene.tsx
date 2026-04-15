import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface Props {
  text: string;
}

// Extracts numbers from impact text and animates them as counters
function extractMetrics(text: string): Array<{ value: string; label: string }> {
  // Match patterns like "50%", "$2M", "3x", "10K", "200+"
  const matches = [...text.matchAll(/(\$?[\d,.]+[KkMmBb%x+]*)\s+([^,.\n]{4,40})/g)];
  if (matches.length > 0) {
    return matches.slice(0, 3).map((m) => ({ value: m[1], label: m[2].trim() }));
  }
  // Fallback: split text into chunks
  const sentences = text.split(/[.!]/).filter((s) => s.trim().length > 5).slice(0, 3);
  return sentences.map((s) => ({ value: '★', label: s.trim() }));
}

export const ImpactScene: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const metrics = extractMetrics(text);
  const headerOpacity = spring({ frame, fps, from: 0, to: 1, durationInFrames: 15 });

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
      <div style={{ opacity: headerOpacity, marginBottom: 64, textAlign: 'center' }}>
        <span style={{ color: '#6366f1', fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>
          KEY IMPACT
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

      {/* Metric cards */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          justifyContent: 'center',
          flexWrap: 'wrap',
          maxWidth: 1400,
        }}
      >
        {metrics.map((metric, i) => {
          const delay = 10 + i * 14;
          const cardOpacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 18 });
          const cardScale = spring({ frame: frame - delay, fps, from: 0.6, to: 1, durationInFrames: 18 });
          // Animate value scale for a "pop" effect
          const valueScale = spring({ frame: frame - delay - 5, fps, from: 0.5, to: 1, durationInFrames: 16 });

          return (
            <div
              key={i}
              style={{
                opacity: cardOpacity,
                transform: `scale(${cardScale})`,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))',
                border: '1.5px solid rgba(99,102,241,0.35)',
                borderRadius: 24,
                padding: '48px 56px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 280,
                gap: 16,
              }}
            >
              {/* Counter value */}
              <span
                style={{
                  color: '#a5b4fc',
                  fontSize: 72,
                  fontWeight: 800,
                  lineHeight: 1,
                  transform: `scale(${valueScale})`,
                  display: 'block',
                  letterSpacing: -2,
                }}
              >
                {metric.value}
              </span>
              {/* Label */}
              <span
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 22,
                  fontWeight: 400,
                  textAlign: 'center',
                  maxWidth: 240,
                  lineHeight: 1.4,
                }}
              >
                {metric.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Fallback narration if no metrics found */}
      {metrics.length === 0 && (
        <p
          style={{
            color: '#a5b4fc',
            fontSize: 36,
            textAlign: 'center',
            maxWidth: 900,
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
