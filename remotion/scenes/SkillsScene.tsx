import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

interface Props {
  text: string;
}

// Extracts comma/bullet-separated skills from the narration text and animates tags in
export const SkillsScene: React.FC<Props> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pull individual skill words from the narration text
  const skills = text
    .split(/[,•\n]/)
    .map((s) => s.replace(/[^a-zA-Z0-9+#.\s-]/g, '').trim())
    .filter((s) => s.length > 1 && s.length < 30)
    .slice(0, 12);

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
      <div style={{ opacity: headerOpacity, marginBottom: 48, textAlign: 'center' }}>
        <span style={{ color: '#6366f1', fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>
          CORE SKILLS
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

      {/* Skill tags — each pops in with staggered delay */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          justifyContent: 'center',
          maxWidth: 1400,
        }}
      >
        {skills.map((skill, i) => {
          const delay = 8 + i * 5;
          const tagOpacity = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 14 });
          const tagScale = spring({ frame: frame - delay, fps, from: 0.7, to: 1, durationInFrames: 14 });

          return (
            <div
              key={i}
              style={{
                opacity: tagOpacity,
                transform: `scale(${tagScale})`,
                background: 'rgba(99,102,241,0.12)',
                border: '1.5px solid rgba(99,102,241,0.4)',
                borderRadius: 12,
                padding: '16px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#6366f1',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: '#e0e7ff', fontSize: 28, fontWeight: 600 }}>{skill}</span>
            </div>
          );
        })}
      </div>

      {/* Narration text below (smaller) */}
      <p
        style={{
          color: 'rgba(165,180,252,0.6)',
          fontSize: 20,
          marginTop: 48,
          maxWidth: 900,
          textAlign: 'center',
          lineHeight: 1.6,
          opacity: headerOpacity,
        }}
      >
        {text.length > 120 ? text.slice(0, 120) + '…' : text}
      </p>
    </div>
  );
};
