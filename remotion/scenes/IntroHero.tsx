import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { Img } from 'remotion';

interface Props {
  title: string;
  subtitle: string;
  photoUrl?: string;
}

export const IntroHero: React.FC<Props> = ({ title, subtitle, photoUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance animations
  const entrance = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const photoReveal = spring({
    frame: frame - 5,
    fps,
    config: { damping: 15 },
  });

  const textSlide = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10 },
  });

  // Photo animations
  const photoScale = interpolate(photoReveal, [0, 1], [0.8, 1]);
  const photoOpacity = interpolate(photoReveal, [0, 1], [0, 1]);
  const photoTranslate = interpolate(photoReveal, [0, 1], [-40, 0]);

  // Text animations
  const nameScale = interpolate(textSlide, [0, 1], [0.9, 1]);
  const nameOpacity = interpolate(textSlide, [0, 1], [0, 1]);
  const headlineTranslate = interpolate(textSlide, [0, 1], [20, 0]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 100px',
      gap: '80px',
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0a0a14 100%)',
    }}>
      {photoUrl && (
        <div style={{
          width: '450px',
          height: '450px',
          borderRadius: '225px',
          border: '8px solid rgba(139, 92, 246, 0.4)',
          overflow: 'hidden',
          opacity: photoOpacity,
          transform: `scale(${photoScale}) translateX(${photoTranslate}px)`,
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.2)',
        }}>
          <Img 
            src={photoUrl} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
      )}

      <div style={{ 
        textAlign: photoUrl ? 'left' : 'center',
        opacity: nameOpacity,
        transform: `scale(${nameScale})`,
      }}>
        <h1 style={{
          fontSize: '110px',
          fontWeight: '900',
          color: 'white',
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: '-2px',
          textShadow: '0 10px 30px rgba(0,0,0,0.5)',
        }}>
          {title}
        </h1>
        <div style={{
          fontSize: '48px',
          fontWeight: '600',
          color: '#8b5cf6',
          marginTop: '20px',
          transform: `translateY(${headlineTranslate}px)`,
          letterSpacing: '1px',
        }}>
          {subtitle}
        </div>
        
        {/* Animated decorative line */}
        <div style={{
          width: interpolate(entrance, [0, 1], [0, 200]),
          height: '6px',
          background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
          borderRadius: '3px',
          marginTop: '40px',
          marginLeft: photoUrl ? '0' : 'auto',
          marginRight: photoUrl ? '0' : 'auto',
        }} />
      </div>
    </div>
  );
};
