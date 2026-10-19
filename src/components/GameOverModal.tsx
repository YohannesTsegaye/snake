import React from 'react';
import { RotateCcw, Home, Trophy, Apple, ArrowUpRight, Zap } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  length: number;
  applesEaten: number;
  maxCombo: number;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  isNewHighScore,
  length,
  applesEaten,
  maxCombo,
  onRestart,
  onHome,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-20 pointer-events-auto select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Header Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-red-400">
            <span>RUN TERMINATED</span>
          </div>
          <h2 className="text-3xl font-black font-mono text-white tracking-wide">
            {isNewHighScore ? 'NEW RECORD!' : 'GAME OVER'}
          </h2>
        </div>

        {/* Score Display Card */}
        <div className="w-full py-4 px-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
            FINAL SCORE
          </span>
          <span className="text-4xl font-black font-mono text-white tabular-nums drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            {score.toLocaleString()}
          </span>

          {isNewHighScore ? (
            <div className="flex items-center gap-1 text-xs font-mono text-amber-400 font-bold pt-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>NEW ALL-TIME BEST!</span>
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-500 pt-1">
              BEST: <span className="text-slate-300 font-medium tabular-nums">{highScore.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Breakdown Stats Grid */}
        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 flex flex-col items-center text-center">
            <ArrowUpRight className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[10px] uppercase font-mono text-slate-400">Length</span>
            <span className="text-sm font-bold font-mono text-white tabular-nums">{length}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 flex flex-col items-center text-center">
            <Apple className="w-4 h-4 text-red-400 mb-1" />
            <span className="text-[10px] uppercase font-mono text-slate-400">Apples</span>
            <span className="text-sm font-bold font-mono text-white tabular-nums">{applesEaten}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 flex flex-col items-center text-center">
            <Zap className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] uppercase font-mono text-slate-400">Combo</span>
            <span className="text-sm font-bold font-mono text-white tabular-nums">{maxCombo}x</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN (SPACE)</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer border border-slate-700"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>TITLE MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
