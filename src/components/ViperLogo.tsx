import React from 'react';

export const ViperLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dims = size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-8 h-8';

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${dims} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]"
        >
          {/* Hexagonal Shield Background */}
          <polygon
            points="24,4 42,14 42,34 24,44 6,34 6,14"
            fill="#064e3b"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Stylized Viper Head Path */}
          <path
            d="M16 17 L24 11 L32 17 L30 28 L24 37 L18 28 Z"
            fill="#059669"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Slit Eyes with Glow */}
          <ellipse cx="20" cy="21" rx="1.5" ry="3.5" transform="rotate(-15 20 21)" fill="#fef08a" />
          <ellipse cx="28" cy="21" rx="1.5" ry="3.5" transform="rotate(15 28 21)" fill="#fef08a" />

          {/* Forked Viper Fang / Tongue */}
          <path
            d="M24 37 L24 41 M24 41 L22 43 M24 41 L26 43"
            stroke="#ef4444"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="flex flex-col">
        <span className="font-extrabold text-2xl tracking-wider text-white font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          VIPER
        </span>
        <span className="text-[10px] uppercase font-semibold tracking-widest text-emerald-400">
          Arcade Edition
        </span>
      </div>
    </div>
  );
};
