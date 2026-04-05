import { useEffect, useState } from 'react';

interface MetronomBarProps {
  bpm: number;
  active: boolean;
}

export function MetronomBar({ bpm, active }: MetronomBarProps) {
  const effectiveBpm = bpm && bpm > 0 ? bpm : 100;
  const duration = 60 / effectiveBpm; // seconds per beat

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px] overflow-hidden">
      <div
        className="h-full w-full rounded-full"
        style={{
          background: 'hsl(var(--chord))',
          animation: `metronom-pulse ${duration}s ease-in-out infinite`,
        }}
      />
      <style>{`
        @keyframes metronom-pulse {
          0%, 100% { opacity: 0.15; transform: scaleX(0.3); }
          50% { opacity: 1; transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
