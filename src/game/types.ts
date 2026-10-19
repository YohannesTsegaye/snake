export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type GameMode = 'classic' | 'wrap' | 'maze';

export type Difficulty = 'chill' | 'arcade' | 'extreme';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type FruitType = 'apple' | 'golden' | 'pepper' | 'mint';

export interface GridCoord {
  x: number;
  y: number;
}

export interface Fruit {
  x: number;
  y: number;
  type: FruitType;
  spawnTime: number;
  duration?: number; // for temporary bonus fruits
  points: number;
}

export interface Obstacle {
  x: number;
  y: number;
  type: 'rock' | 'portal';
  targetPortal?: GridCoord;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  life: number;
}

export interface FloatingNumber {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  duration: number;
  elapsed: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  length: number;
  applesEaten: number;
  maxCombo: number;
  currentCombo: number;
  comboTimeLeft: number; // 0 to 1 ratio
  activePowerUp: {
    type: FruitType;
    timeLeft: number;
    totalDuration: number;
  } | null;
  mode: GameMode;
  difficulty: Difficulty;
}

export interface HighScoreRecord {
  score: number;
  mode: GameMode;
  difficulty: Difficulty;
  date: string;
}
