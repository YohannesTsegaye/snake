import React from 'react';
import { Play, Volume2, VolumeX, Shield, Zap, Compass } from 'lucide-react';
import { Difficulty, GameMode } from '../game/types';
import { ViperLogo } from './ViperLogo';

interface TitleScreenProps {
  mode: GameMode;
  difficulty: Difficulty;
  highScore: number;
  isMuted: boolean;
  onSetMode: (mode: GameMode) => void;
  onSetDifficulty: (diff: Difficulty) => void;
  onStartGame: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  mode,
  difficulty,
  highScore,
  isMuted,
  onSetMode,
  onSetDifficulty,
  onStartGame,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between items-center p-6 md:p-10 pointer-events-auto bg-slate-950/75 select-none backdrop-blur-xs">
      {/* Top Header Row with Sound Toggle and High Score */}
      <div className="w-full max-w-4xl flex items-center justify-between">
        <ViperLogo size="md" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <span>HIGH SCORE</span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {highScore.toLocaleString()}
            </span>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Atmospheric title & interactive start */}
      <div className="flex flex-col items-center text-center max-w-xl mx-auto my-auto space-y-7">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight font-mono">
            NEO-ARCADE <span className="text-emerald-400">SLITHER</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
            Fluid 60 FPS snake combat with turn-buffering, turbo sprint, combo chain multipliers, and power-up frenzy.
          </p>
        </div>

        {/* Primary Start CTA */}
        <button
          onClick={onStartGame}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-98 rounded-xl shadow-[0_0_24px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
          <span>START GAME</span>
          <span className="hidden sm:inline-block ml-1 px-2 py-0.5 text-[11px] font-mono font-normal uppercase bg-emerald-500/40 rounded text-emerald-950">
            Space / Enter
          </span>
        </button>

        {/* Game Mode Selector */}
        <div className="flex flex-col gap-2 w-full max-w-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Game Mode
          </span>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => onSetMode('classic')}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                mode === 'classic'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Classic</span>
              <span className="text-[10px] text-slate-500">Deadly Walls</span>
            </button>

            <button
              onClick={() => onSetMode('wrap')}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                mode === 'wrap'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Wrap</span>
              <span className="text-[10px] text-slate-500">Infinite Edges</span>
            </button>

            <button
              onClick={() => onSetMode('maze')}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                mode === 'maze'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Maze</span>
              <span className="text-[10px] text-slate-500">Rocks & Hazard</span>
            </button>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-slate-400">Speed:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
            {(['chill', 'arcade', 'extreme'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => onSetDifficulty(diff)}
                className={`px-3 py-1 rounded-md text-xs font-mono uppercase transition-colors cursor-pointer ${
                  difficulty === diff
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flat Control-Hint Line */}
      <div className="text-xs font-mono text-slate-400 text-center tracking-wide">
        <span>WASD / Arrow Keys Move</span>
        <span className="mx-2 text-slate-600">·</span>
        <span>Space Turbo Sprint</span>
        <span className="mx-2 text-slate-600">·</span>
        <span>Esc Pause</span>
      </div>
    </div>
  );
};
