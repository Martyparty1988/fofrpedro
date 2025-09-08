import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface SpeechBubbleProps {
  text: string;
  position: [number, number, number];
  duration: number; // in seconds
}

export const SpeechBubble3D: React.FC<SpeechBubbleProps> = ({ text, position, duration }) => {
  const ref = useRef<HTMLDivElement>(null!);
  const life = useRef(0);

  // Fade in/out animation
  useFrame((_, delta) => {
    life.current += delta;
    const progress = life.current / duration;

    if (ref.current) {
        // Fade in for first 15% of life
        if (progress < 0.15) {
            const fadeInProgress = progress / 0.15;
            ref.current.style.opacity = `${fadeInProgress}`;
            ref.current.style.transform = `translate(-50%, -100%) scale(${0.8 + fadeInProgress * 0.2})`;
        } 
        // Fade out for last 15% of life
        else if (progress > 0.85) { 
            const fadeOutProgress = (progress - 0.85) / 0.15;
            ref.current.style.opacity = `${1 - fadeOutProgress}`;
            ref.current.style.transform = `translate(-50%, -100%) scale(${1 - fadeOutProgress * 0.2})`;
        } 
        // Fully visible
        else {
            ref.current.style.opacity = '1';
            ref.current.style.transform = 'translate(-50%, -100%) scale(1)';
        }
    }
  });

  return (
    <Html position={position} center>
      <div ref={ref} style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#1a1a1a',
          padding: '10px 15px',
          borderRadius: '20px',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '16px',
          fontWeight: 'bold',
          maxWidth: '200px',
          textAlign: 'center',
          opacity: 0,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          border: '2px solid #333',
          willChange: 'transform, opacity',
      }}>
          {text}
          <div style={{
              content: '""',
              position: 'absolute',
              left: '50%',
              width: '0',
              height: '0',
              border: '12px solid transparent',
              borderTopColor: '#333',
              borderBottom: '0',
              marginLeft: '-12px',
              // FIX: Removed duplicate 'bottom' property. Using '-12px' for correct tail positioning.
              bottom: '-12px'
          }} />
           <div style={{
              content: '""',
              position: 'absolute',
              // FIX: Removed duplicate 'bottom' property. Using '-10px' for a consistent 2px border.
              bottom: '-10px',
              left: '50%',
              width: '0',
              height: '0',
              border: '10px solid transparent',
              borderTopColor: 'rgba(255, 255, 255, 0.95)',
              borderBottom: '0',
              marginLeft: '-10px',
          }} />
      </div>
    </Html>
  );
};
