/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SnakeEngine } from './game/engine';
import { sound } from './game/sound';
import { Difficulty, FruitType, GameMode, GameState } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { TouchControls } from './components/TouchControls';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SnakeEngine | null>(null);

  // UI state synchronized from engine
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [mode, setMode] = useState<GameMode>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('arcade');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [length, setLength] = useState<number>(3);
  const [applesEaten, setApplesEaten] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [comboTimeRatio, setComboTimeRatio] = useState<number>(0);
  const [powerUp, setPowerUp] = useState<{ type: FruitType; timeLeft: number } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Game over modal state
  const [gameOverSummary, setGameOverSummary] = useState<{
    score: number;
    highScore: number;
    isNewHighScore: boolean;
    length: number;
    applesEaten: number;
    maxCombo: number;
  } | null>(null);

  // Initialize engine once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new SnakeEngine(canvasRef.current);
    engineRef.current = engine;

    engine.onStatsUpdate = (stats) => {
      setScore(stats.score);
      setHighScore(stats.highScore);
      setLength(stats.length);
      setApplesEaten(stats.applesEaten);
      setComboCount(stats.currentCombo);
      setMaxCombo(stats.maxCombo);
      setComboTimeRatio(stats.comboTimeRatio);
      setPowerUp(stats.powerUp);
      setGameState(stats.state);
    };

    engine.onGameOver = (summary) => {
      setGameOverSummary(summary);
    };

    setHighScore(engine.highScore);

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  // Update mode or difficulty in engine
  const handleSetMode = useCallback((newMode: GameMode) => {
    setMode(newMode);
    if (engineRef.current) {
      engineRef.current.setModeAndDifficulty(newMode, difficulty);
      setHighScore(engineRef.current.highScore);
    }
  }, [difficulty]);

  const handleSetDifficulty = useCallback((newDiff: Difficulty) => {
    setDifficulty(newDiff);
    if (engineRef.current) {
      engineRef.current.setModeAndDifficulty(mode, newDiff);
      setHighScore(engineRef.current.highScore);
    }
  }, [mode]);

  // Start new game
  const handleStartGame = useCallback(() => {
    setGameOverSummary(null);
    if (engineRef.current) {
      engineRef.current.startNewGame();
    }
  }, []);

  // Pause & Resume
  const handleTogglePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  }, []);

  // Return to Title Menu
  const handleReturnToTitle = useCallback(() => {
    setGameOverSummary(null);
    if (engineRef.current) {
      engineRef.current.returnToTitle();
    }
  }, []);

  // Mute toggle
  const handleToggleMute = useCallback(() => {
    const updated = sound.toggleMute();
    setIsMuted(updated);
  }, []);

  // Keyboard input listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const engine = engineRef.current;
      if (!engine) return;

      // Prevent default window scrolling on game keys
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)
      ) {
        e.preventDefault();
      }

      // Movement keys
      if (code === 'ArrowUp' || code === 'KeyW') {
        engine.queueInput('UP');
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        engine.queueInput('DOWN');
      } else if (code === 'ArrowLeft' || code === 'KeyA') {
        engine.queueInput('LEFT');
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        engine.queueInput('RIGHT');
      }

      // Space action
      if (code === 'Space') {
        if (engine.state === 'TITLE' || engine.state === 'GAME_OVER') {
          handleStartGame();
        } else if (engine.state === 'PAUSED') {
          engine.togglePause();
        } else if (engine.state === 'PLAYING') {
          engine.setBoosting(true);
        }
      }

      // Enter action
      if (code === 'Enter') {
        if (engine.state === 'TITLE' || engine.state === 'GAME_OVER') {
          handleStartGame();
        }
      }

      // Pause toggle
      if (code === 'Escape' || code === 'KeyP') {
        engine.togglePause();
      }

      // Mute toggle shortcut (M)
      if (code === 'KeyM') {
        handleToggleMute();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Space') {
        engine.setBoosting(false);
      }
    };

    const onBlur = () => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.setBoosting(false);
      if (engine.state === 'PLAYING') {
        engine.togglePause();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [handleStartGame, handleToggleMute]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.08)_0%,_transparent_70%)] pointer-events-none" />

      {/* Isolated Canvas Container */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.85)] border border-slate-800/80 transition-shadow"
        />

        {/* Title Screen Overlay */}
        {gameState === 'TITLE' && (
          <TitleScreen
            mode={mode}
            difficulty={difficulty}
            highScore={highScore}
            isMuted={isMuted}
            onSetMode={handleSetMode}
            onSetDifficulty={handleSetDifficulty}
            onStartGame={handleStartGame}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* In-Game HUD Overlay */}
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <HUD
            score={score}
            highScore={highScore}
            length={length}
            comboCount={comboCount}
            comboTimeRatio={comboTimeRatio}
            powerUp={powerUp}
            mode={mode}
            isMuted={isMuted}
            onPause={handleTogglePause}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* Pause Modal */}
        {gameState === 'PAUSED' && (
          <PauseModal
            score={score}
            isMuted={isMuted}
            onResume={handleTogglePause}
            onRestart={handleStartGame}
            onHome={handleReturnToTitle}
            onToggleMute={handleToggleMute}
          />
        )}

        {/* Game Over Modal */}
        {gameState === 'GAME_OVER' && gameOverSummary && (
          <GameOverModal
            score={gameOverSummary.score}
            highScore={gameOverSummary.highScore}
            isNewHighScore={gameOverSummary.isNewHighScore}
            length={gameOverSummary.length}
            applesEaten={gameOverSummary.applesEaten}
            maxCombo={gameOverSummary.maxCombo}
            onRestart={handleStartGame}
            onHome={handleReturnToTitle}
          />
        )}
      </div>

      {/* Mobile / Touch D-Pad for active games */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <TouchControls
          onDirection={(dir) => engineRef.current?.queueInput(dir)}
          onTurboStart={() => engineRef.current?.setBoosting(true)}
          onTurboEnd={() => engineRef.current?.setBoosting(false)}
        />
      )}
    </main>
  );
}
