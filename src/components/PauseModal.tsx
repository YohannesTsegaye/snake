import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  score: number;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  score,
  isMuted,
  onResume,
  onRestart,
  onHome,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-20 pointer-events-auto select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black font-mono text-white tracking-wide">GAME PAUSED</h2>
          <div className="text-xs font-mono text-slate-400">
            CURRENT SCORE: <span className="text-emerald-400 font-bold tabular-nums">{score.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all cursor-pointer shadow-[0_0_16px_rgba(16,185,129,0.3)]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME (ESC / SPACE)</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>RESTART LEVEL</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer border border-slate-800"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>MAIN MENU</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800 w-full flex items-center justify-between text-xs text-slate-400">
          <span>Audio Sound</span>
          <button
            onClick={onToggleMute}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'Muted' : 'Enabled'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
