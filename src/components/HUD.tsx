import React from 'react';
import { Pause, Volume2, VolumeX, Flame, Snowflake } from 'lucide-react';
import { FruitType, GameMode } from '../game/types';

interface HUDProps {
  score: number;
  highScore: number;
  length: number;
  comboCount: number;
  comboTimeRatio: number;
  powerUp: { type: FruitType; timeLeft: number } | null;
  mode: GameMode;
  isMuted: boolean;
  onPause: () => void;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  length,
  comboCount,
  comboTimeRatio,
  powerUp,
  mode,
  isMuted,
  onPause,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between select-none">
      {/* Top Perimeter HUD Cluster */}
      <div className="w-full flex items-start justify-between">
        {/* Left Status: Current Score & Combo Meter */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              SCORE
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Combo Multiplier indicator */}
          {comboCount > 1 && (
            <div className="flex flex-col gap-1 w-28 sm:w-32 bg-slate-900/90 border border-amber-500/40 rounded-md p-1.5 shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-400">
                <span>COMBO</span>
                <span>{comboCount}x</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-75"
                  style={{ width: `${Math.round(comboTimeRatio * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center: Active Power-up alert */}
        {powerUp && (
          <div className="pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 shadow-md">
            {powerUp.type === 'pepper' ? (
              <>
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-orange-300">
                  FRENZY 2X · {powerUp.timeLeft}s
                </span>
              </>
            ) : powerUp.type === 'mint' ? (
              <>
                <Snowflake className="w-4 h-4 text-sky-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-sky-300">
                  SLOW-MO · {powerUp.timeLeft}s
                </span>
              </>
            ) : null}
          </div>
        )}

        {/* Right Status: High score, length, control buttons */}
        <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto">
          {/* Metadata counts */}
          <div className="hidden sm:flex flex-col items-end text-xs font-mono">
            <div className="text-slate-400">
              HI <span className="text-emerald-400 font-bold tabular-nums">{highScore.toLocaleString()}</span>
            </div>
            <div className="text-slate-400">
              LEN <span className="text-white font-medium tabular-nums">{length}</span>
              <span className="mx-1 text-slate-600">·</span>
              <span className="uppercase text-slate-400">{mode}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onPause}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Pause Game (Esc)"
              aria-label="Pause Game"
            >
              <Pause className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
