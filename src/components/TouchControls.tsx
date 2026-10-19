import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { Direction } from '../game/types';

interface TouchControlsProps {
  onDirection: (dir: Direction) => void;
  onTurboStart: () => void;
  onTurboEnd: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirection,
  onTurboStart,
  onTurboEnd,
}) => {
  return (
    <div className="md:hidden pointer-events-auto pb-4 px-4 flex items-center justify-between w-full max-w-sm mx-auto select-none">
      {/* 4-way D-Pad */}
      <div className="grid grid-cols-3 gap-1.5 w-36 h-36">
        <div />
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onDirection('UP');
          }}
          onClick={() => onDirection('UP')}
          className="bg-slate-900/90 border border-slate-700 active:bg-emerald-600 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div />

        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onDirection('LEFT');
          }}
          onClick={() => onDirection('LEFT')}
          className="bg-slate-900/90 border border-slate-700 active:bg-emerald-600 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Left"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="bg-slate-900/50 rounded-lg flex items-center justify-center text-slate-600 text-[10px]">
          ✦
        </div>
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onDirection('RIGHT');
          }}
          onClick={() => onDirection('RIGHT')}
          className="bg-slate-900/90 border border-slate-700 active:bg-emerald-600 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Right"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div />
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onDirection('DOWN');
          }}
          onClick={() => onDirection('DOWN')}
          className="bg-slate-900/90 border border-slate-700 active:bg-emerald-600 rounded-xl flex items-center justify-center text-white active:scale-95 transition-transform"
          aria-label="Down"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <div />
      </div>

      {/* Turbo Sprint Action Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onTurboStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onTurboEnd();
          }}
          onMouseDown={onTurboStart}
          onMouseUp={onTurboEnd}
          onMouseLeave={onTurboEnd}
          className="w-20 h-20 rounded-2xl bg-amber-500/20 active:bg-amber-500 border border-amber-500/50 flex flex-col items-center justify-center text-amber-300 active:text-slate-950 active:scale-95 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
        >
          <Zap className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">TURBO</span>
        </button>
        <span className="text-[9px] font-mono text-slate-500">HOLD FOR SPRINT</span>
      </div>
    </div>
  );
};
