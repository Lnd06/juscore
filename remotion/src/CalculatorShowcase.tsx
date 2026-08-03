import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { MemoryRouter } from 'react-router-dom';
import Calculator from '@/pages/dashboard/Calculator';

export const CalculatorShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth entrance scale animation
  const scale = spring({
    frame,
    fps,
    config: {
      damping: 15,
      mass: 0.8,
      stiffness: 100,
    },
  });

  return (
    <AbsoluteFill className="bg-[#05070c] flex items-center justify-center p-12">
      <div 
        style={{ 
          transform: `scale(${scale})`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        className="w-full h-full bg-[#0B0F19] text-white rounded-3xl overflow-hidden border border-white/5 flex flex-col p-8"
      >
        <MemoryRouter>
          <Calculator mode="private" defaultTab="interest" />
        </MemoryRouter>
      </div>
    </AbsoluteFill>
  );
};
