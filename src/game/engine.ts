/**
 * Core 60fps Game Engine for Viper Snake.
 * Features:
 * - Decoupled sub-tick interpolation for silky 60fps movement
 * - Input queue buffering (prevents dropped inputs or 180° self-kills)
 * - Screen shake, hitstop, and procedural particle systems
 * - Attract Mode autonomous AI for Title Screen
 * - Procedural sound triggers
 */

import { sound } from './sound';
import {
  Difficulty,
  Direction,
  FloatingNumber,
  Fruit,
  FruitType,
  GameMode,
  GameState,
  GridCoord,
  Obstacle,
  Particle,
} from './types';

export class SnakeEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Grid dimensions
  public readonly cols: number = 28;
  public readonly rows: number = 20;
  private cellSize: number = 24;

  // Game state
  public state: GameState = 'TITLE';
  public mode: GameMode = 'classic';
  public difficulty: Difficulty = 'arcade';

  // Snake body: array of coordinates (0 is head)
  private snake: GridCoord[] = [];
  private prevSnake: GridCoord[] = []; // For smooth interpolation
  private currentDir: Direction = 'RIGHT';
  private inputQueue: Direction[] = [];
  private isBoosting: boolean = false;

  // Fruits and obstacles
  private fruits: Fruit[] = [];
  private obstacles: Obstacle[] = [];

  // Timing & loop
  private lastTime: number = 0;
  private accumulator: number = 0;
  private tickInterval: number = 100; // ms per step
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private hitstopTimer: number = 0;

  // Visual effects
  private particles: Particle[] = [];
  private floatingTexts: FloatingNumber[] = [];
  private screenShake: number = 0;
  private flashAlpha: number = 0;
  private flashColor: string = '#ffffff';
  private nextFloatingId: number = 1;

  // Combo & scoring
  public score: number = 0;
  public highScore: number = 0;
  public applesEaten: number = 0;
  public comboCount: number = 0;
  public maxCombo: number = 0;
  private comboTimer: number = 0;
  private readonly comboMaxTime: number = 3800; // ms

  // Powerups
  public activePowerUp: {
    type: FruitType;
    timeLeft: number;
    totalDuration: number;
  } | null = null;

  // Attract mode AI
  private isAttractMode: boolean = true;
  private attractChangeTimer: number = 0;

  // Callbacks to UI for HUD updates
  public onStatsUpdate?: (stats: {
    score: number;
    highScore: number;
    length: number;
    applesEaten: number;
    currentCombo: number;
    maxCombo: number;
    comboTimeRatio: number;
    powerUp: { type: FruitType; timeLeft: number } | null;
    state: GameState;
  }) => void;

  public onGameOver?: (summary: {
    score: number;
    highScore: number;
    isNewHighScore: boolean;
    length: number;
    applesEaten: number;
    maxCombo: number;
  }) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to obtain 2D rendering context');
    }
    this.ctx = context;

    this.loadHighScore();
    this.resize();
    this.initAttractMode();
    this.startLoop();
  }

  public setModeAndDifficulty(mode: GameMode, difficulty: Difficulty) {
    this.mode = mode;
    this.difficulty = difficulty;
    this.loadHighScore();
  }

  private getHighScoreKey(): string {
    return `viper_hiscore_${this.mode}_${this.difficulty}`;
  }

  private loadHighScore() {
    try {
      const saved = localStorage.getItem(this.getHighScoreKey());
      this.highScore = saved ? parseInt(saved, 10) : 0;
    } catch {
      this.highScore = 0;
    }
  }

  private saveHighScore() {
    try {
      localStorage.setItem(this.getHighScoreKey(), String(this.highScore));
    } catch {
      // ignore
    }
  }

  public resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate cell size that fits the container while maintaining aspect ratio
    const idealCellW = Math.floor(width / this.cols);
    const idealCellH = Math.floor(height / this.rows);
    this.cellSize = Math.max(14, Math.min(idealCellW, idealCellH, 36));

    const totalWidth = this.cellSize * this.cols;
    const totalHeight = this.cellSize * this.rows;

    this.canvas.width = totalWidth * dpr;
    this.canvas.height = totalHeight * dpr;
    this.canvas.style.width = `${totalWidth}px`;
    this.canvas.style.height = `${totalHeight}px`;

    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  public startNewGame() {
    this.isAttractMode = false;
    this.state = 'PLAYING';
    this.score = 0;
    this.applesEaten = 0;
    this.comboCount = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.activePowerUp = null;
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.hitstopTimer = 0;

    // Base tick interval by difficulty
    this.tickInterval =
      this.difficulty === 'chill' ? 140 : this.difficulty === 'arcade' ? 105 : 75;

    // Starting snake at center
    const startX = Math.floor(this.cols / 2);
    const startY = Math.floor(this.rows / 2);
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.prevSnake = JSON.parse(JSON.stringify(this.snake));
    this.currentDir = 'RIGHT';
    this.inputQueue = [];

    // Reset obstacles
    this.obstacles = [];
    if (this.mode === 'maze') {
      this.generateMazeObstacles();
    }

    // Spawn initial food
    this.fruits = [];
    this.spawnFruit('apple');

    sound.playClick();
    this.notifyStats();
  }

  private initAttractMode() {
    this.isAttractMode = true;
    this.state = 'TITLE';
    this.tickInterval = 115;
    const startX = 6;
    const startY = 8;
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
      { x: startX - 3, y: startY },
      { x: startX - 4, y: startY },
    ];
    this.prevSnake = JSON.parse(JSON.stringify(this.snake));
    this.currentDir = 'RIGHT';
    this.inputQueue = [];
    this.obstacles = [];
    this.fruits = [];
    this.spawnFruit('apple');
    this.spawnFruit('golden');
  }

  public queueInput(dir: Direction) {
    if (this.state !== 'PLAYING') return;

    // Check against the last queued direction or current direction
    const lastDir =
      this.inputQueue.length > 0
        ? this.inputQueue[this.inputQueue.length - 1]
        : this.currentDir;

    // Disallow 180° reversals
    const isOpposite =
      (dir === 'UP' && lastDir === 'DOWN') ||
      (dir === 'DOWN' && lastDir === 'UP') ||
      (dir === 'LEFT' && lastDir === 'RIGHT') ||
      (dir === 'RIGHT' && lastDir === 'LEFT');

    if (!isOpposite && this.inputQueue.length < 2) {
      this.inputQueue.push(dir);
    }
  }

  public setBoosting(boosting: boolean) {
    this.isBoosting = boosting;
  }

  public togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      sound.playClick();
      this.notifyStats();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      sound.playClick();
      this.notifyStats();
    }
  }

  public returnToTitle() {
    this.initAttractMode();
    sound.playClick();
    this.notifyStats();
  }

  private generateMazeObstacles() {
    // Generate 4 to 8 strategic obstacles that don't block the center
    const count = 6;
    for (let i = 0; i < count; i++) {
      const rockX = Math.floor(Math.random() * (this.cols - 4)) + 2;
      const rockY = Math.floor(Math.random() * (this.rows - 4)) + 2;

      // Don't place on snake spawn
      const nearCenter =
        Math.abs(rockX - this.cols / 2) < 4 && Math.abs(rockY - this.rows / 2) < 4;
      if (!nearCenter) {
        this.obstacles.push({ x: rockX, y: rockY, type: 'rock' });
      }
    }
  }

  private isOccupied(x: number, y: number): boolean {
    if (this.snake.some((s) => s.x === x && s.y === y)) return true;
    if (this.obstacles.some((o) => o.x === x && o.y === y)) return true;
    if (this.fruits.some((f) => f.x === x && f.y === y)) return true;
    return false;
  }

  private spawnFruit(forceType?: FruitType) {
    let attempts = 0;
    while (attempts < 200) {
      attempts++;
      const x = Math.floor(Math.random() * this.cols);
      const y = Math.floor(Math.random() * this.rows);

      if (!this.isOccupied(x, y)) {
        let type: FruitType = forceType || 'apple';
        if (!forceType) {
          const roll = Math.random();
          if (roll < 0.12) {
            type = 'golden';
          } else if (roll < 0.18) {
            type = 'pepper';
          } else if (roll < 0.24) {
            type = 'mint';
          } else {
            type = 'apple';
          }
        }

        const fruit: Fruit = {
          x,
          y,
          type,
          spawnTime: performance.now(),
          duration: type === 'golden' ? 9000 : type === 'pepper' || type === 'mint' ? 11000 : undefined,
          points: type === 'golden' ? 300 : type === 'pepper' ? 200 : type === 'mint' ? 150 : 100,
        };

        this.fruits.push(fruit);
        break;
      }
    }
  }

  // AI pathfinder for Attract Mode on Title Screen
  private updateAttractAI() {
    this.attractChangeTimer++;
    const head = this.snake[0];
    const target = this.fruits[0] || { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) };

    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    // Filter out opposite direction
    const validDirs = directions.filter((d) => {
      if (this.currentDir === 'UP' && d === 'DOWN') return false;
      if (this.currentDir === 'DOWN' && d === 'UP') return false;
      if (this.currentDir === 'LEFT' && d === 'RIGHT') return false;
      if (this.currentDir === 'RIGHT' && d === 'LEFT') return false;
      return true;
    });

    // Score moves based on safety and distance to target
    let bestDir = this.currentDir;
    let minDistance = Infinity;

    for (const d of validDirs) {
      let nextX = head.x;
      let nextY = head.y;
      if (d === 'UP') nextY--;
      if (d === 'DOWN') nextY++;
      if (d === 'LEFT') nextX--;
      if (d === 'RIGHT') nextX++;

      // Check walls in classic mode
      if (nextX < 0 || nextX >= this.cols || nextY < 0 || nextY >= this.rows) {
        continue;
      }

      // Check self-collision
      const hitsSelf = this.snake.slice(0, -1).some((s) => s.x === nextX && s.y === nextY);
      if (hitsSelf) continue;

      const dist = Math.abs(nextX - target.x) + Math.abs(nextY - target.y);
      if (dist < minDistance) {
        minDistance = dist;
        bestDir = d;
      }
    }

    this.currentDir = bestDir;
  }

  private stepSimulation() {
    if (this.isAttractMode) {
      this.updateAttractAI();
    } else if (this.inputQueue.length > 0) {
      this.currentDir = this.inputQueue.shift()!;
    }

    // Save previous snake positions for smooth sub-tick interpolation
    this.prevSnake = JSON.parse(JSON.stringify(this.snake));

    const head = { ...this.snake[0] };
    if (this.currentDir === 'UP') head.y -= 1;
    if (this.currentDir === 'DOWN') head.y += 1;
    if (this.currentDir === 'LEFT') head.x -= 1;
    if (this.currentDir === 'RIGHT') head.x += 1;

    // Handle wrapping or wall collisions
    if (this.mode === 'wrap' || this.isAttractMode) {
      if (head.x < 0) head.x = this.cols - 1;
      if (head.x >= this.cols) head.x = 0;
      if (head.y < 0) head.y = this.rows - 1;
      if (head.y >= this.rows) head.y = 0;
    } else {
      // Classic & Maze: hitting border is death
      if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
        this.triggerDeath('wall');
        return;
      }
    }

    // Self-collision
    const selfCollision = this.snake.some((s) => s.x === head.x && s.y === head.y);
    if (selfCollision) {
      if (this.isAttractMode) {
        // Reset attract snake gently
        this.initAttractMode();
        return;
      }
      this.triggerDeath('self');
      return;
    }

    // Obstacle collision
    const obstacleCollision = this.obstacles.some((o) => o.x === head.x && o.y === head.y);
    if (obstacleCollision) {
      this.triggerDeath('obstacle');
      return;
    }

    // Move snake head
    this.snake.unshift(head);

    // Check fruit consumption
    const fruitIndex = this.fruits.findIndex((f) => f.x === head.x && f.y === head.y);

    if (fruitIndex !== -1) {
      const eaten = this.fruits.splice(fruitIndex, 1)[0];
      this.handleFruitEaten(eaten);
      // Snake grows, tail is not popped!
    } else {
      // Normal step: pop tail
      this.snake.pop();
    }

    // Spawn turbo trail sparks if boosting
    if (this.isBoosting && !this.isAttractMode) {
      const tail = this.snake[this.snake.length - 1];
      this.addSpark(
        tail.x * this.cellSize + this.cellSize / 2,
        tail.y * this.cellSize + this.cellSize / 2,
        '#f59e0b'
      );
    }
  }

  private handleFruitEaten(fruit: Fruit) {
    this.applesEaten++;

    // Combo handling
    this.comboCount++;
    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }
    this.comboTimer = this.comboMaxTime;

    // Powerup multiplier calculation
    let multiplier = Math.min(this.comboCount, 6);
    if (this.activePowerUp?.type === 'pepper') {
      multiplier *= 2;
    }

    const earnedPoints = fruit.points * multiplier;
    this.score += earnedPoints;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }

    // Visual & Audio effects based on fruit type
    const pixelX = fruit.x * this.cellSize + this.cellSize / 2;
    const pixelY = fruit.y * this.cellSize + this.cellSize / 2;

    if (fruit.type === 'apple') {
      sound.playBite(this.comboCount);
      this.createBurst(pixelX, pixelY, '#ef4444', 16);
      this.addFloatingNumber(`+${earnedPoints}${multiplier > 1 ? ` x${multiplier}` : ''}`, pixelX, pixelY, '#ef4444');
    } else if (fruit.type === 'golden') {
      sound.playBonus();
      this.screenShake = 6;
      this.createBurst(pixelX, pixelY, '#facc15', 26);
      this.addFloatingNumber(`+${earnedPoints} STAR!`, pixelX, pixelY, '#facc15');
    } else if (fruit.type === 'pepper') {
      sound.playTurboPower();
      this.screenShake = 7;
      this.activePowerUp = { type: 'pepper', timeLeft: 7000, totalDuration: 7000 };
      this.createBurst(pixelX, pixelY, '#f97316', 22);
      this.addFloatingNumber(`FRENZY 2X!`, pixelX, pixelY, '#f97316');
    } else if (fruit.type === 'mint') {
      sound.playFreeze();
      this.activePowerUp = { type: 'mint', timeLeft: 8000, totalDuration: 8000 };
      this.createBurst(pixelX, pixelY, '#38bdf8', 22);
      this.addFloatingNumber(`SLOW-MO!`, pixelX, pixelY, '#38bdf8');
    }

    // Ensure there's always at least 1 apple on screen
    const hasApple = this.fruits.some((f) => f.type === 'apple');
    if (!hasApple) {
      this.spawnFruit('apple');
    }

    // Chance to spawn special fruit if less than 3 fruits total
    if (this.fruits.length < 3 && Math.random() < 0.35) {
      this.spawnFruit();
    }

    if (this.mode === 'maze' && this.applesEaten % 5 === 0 && this.obstacles.length < 14) {
      // Add dynamic rock
      this.spawnDynamicObstacle();
    }

    this.notifyStats();
  }

  private spawnDynamicObstacle() {
    for (let attempts = 0; attempts < 50; attempts++) {
      const rx = Math.floor(Math.random() * this.cols);
      const ry = Math.floor(Math.random() * this.rows);
      const head = this.snake[0];
      const distFromHead = Math.abs(rx - head.x) + Math.abs(ry - head.y);
      if (distFromHead > 5 && !this.isOccupied(rx, ry)) {
        this.obstacles.push({ x: rx, y: ry, type: 'rock' });
        this.createBurst(rx * this.cellSize + this.cellSize / 2, ry * this.cellSize + this.cellSize / 2, '#94a3b8', 12);
        break;
      }
    }
  }

  private triggerDeath(reason: string) {
    void reason;
    this.state = 'GAME_OVER';
    sound.playCrash();

    // Game feel: 60ms hitstop
    this.hitstopTimer = 60;
    this.screenShake = 16;
    this.flashAlpha = 0.45;
    this.flashColor = '#ef4444';

    // Explode all snake segments into debris
    this.snake.forEach((seg, i) => {
      const px = seg.x * this.cellSize + this.cellSize / 2;
      const py = seg.y * this.cellSize + this.cellSize / 2;
      setTimeout(() => {
        this.createBurst(px, py, i === 0 ? '#34d399' : '#10b981', 8);
      }, i * 15);
    });

    const isNewHighScore = this.score >= this.highScore && this.score > 0;
    if (isNewHighScore) {
      sound.playHighScore();
    }

    if (this.onGameOver) {
      this.onGameOver({
        score: this.score,
        highScore: this.highScore,
        isNewHighScore,
        length: this.snake.length,
        applesEaten: this.applesEaten,
        maxCombo: this.maxCombo,
      });
    }

    this.notifyStats();
  }

  private createBurst(x: number, y: number, color: string, count: number = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 1.2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 3 + 2,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.02,
        life: 1,
      });
    }
  }

  private addSpark(x: number, y: number, color: string) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      color,
      size: Math.random() * 2 + 1.5,
      alpha: 0.9,
      decay: 0.04,
      life: 1,
    });
  }

  private addFloatingNumber(text: string, x: number, y: number, color: string) {
    this.floatingTexts.push({
      id: this.nextFloatingId++,
      text,
      x,
      y,
      color,
      alpha: 1,
      scale: 1,
      duration: 900,
      elapsed: 0,
    });
  }

  private notifyStats() {
    if (!this.onStatsUpdate) return;
    this.onStatsUpdate({
      score: this.score,
      highScore: this.highScore,
      length: this.snake.length,
      applesEaten: this.applesEaten,
      currentCombo: this.comboCount,
      maxCombo: this.maxCombo,
      comboTimeRatio: Math.max(0, this.comboTimer / this.comboMaxTime),
      powerUp: this.activePowerUp
        ? {
            type: this.activePowerUp.type,
            timeLeft: Math.ceil(this.activePowerUp.timeLeft / 1000),
          }
        : null,
      state: this.state,
    });
  }

  // Master Game Loop
  private startLoop() {
    this.isRunning = true;
    this.lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!this.isRunning) return;

      const rawDt = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      // Clamp delta time to avoid spiral of death
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private update(dt: number) {
    // Hitstop freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt * 1000;
      return;
    }

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }

    // Flash decay
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2);
    }

    // Update active powerups
    if (this.activePowerUp) {
      this.activePowerUp.timeLeft -= dt * 1000;
      if (this.activePowerUp.timeLeft <= 0) {
        this.activePowerUp = null;
        this.notifyStats();
      }
    }

    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt * 1000;
      if (this.comboTimer <= 0) {
        this.comboTimer = 0;
        this.comboCount = 0;
        this.notifyStats();
      }
    }

    // Clean up expired bonus fruits
    const now = performance.now();
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      if (f.duration && now - f.spawnTime > f.duration) {
        this.createBurst(f.x * this.cellSize + this.cellSize / 2, f.y * this.cellSize + this.cellSize / 2, '#64748b', 8);
        this.fruits.splice(i, 1);
      }
    }
    if (!this.fruits.some((f) => f.type === 'apple')) {
      this.spawnFruit('apple');
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating score texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.elapsed += dt * 1000;
      ft.y -= dt * 28;
      ft.alpha = Math.max(0, 1 - ft.elapsed / ft.duration);
      if (ft.elapsed >= ft.duration) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Fixed-step simulation tick
    if (this.state === 'PLAYING' || this.isAttractMode) {
      let speedFactor = 1.0;
      if (this.isBoosting && !this.isAttractMode) {
        speedFactor *= 1.75;
      }
      if (this.activePowerUp?.type === 'mint') {
        speedFactor *= 0.65;
      } else if (this.activePowerUp?.type === 'pepper') {
        speedFactor *= 1.4;
      }

      const effectiveInterval = Math.max(35, this.tickInterval / speedFactor);

      this.accumulator += dt * 1000;
      while (this.accumulator >= effectiveInterval) {
        this.stepSimulation();
        this.accumulator -= effectiveInterval;
      }
    }
  }

  // Render Pass
  private render() {
    const ctx = this.ctx;
    const totalW = this.cols * this.cellSize;
    const totalH = this.rows * this.cellSize;

    ctx.save();

    // Apply camera trauma shake
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // Clear background: Deep modern dark slate
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, totalW, totalH);

    // Subtle arena grid
    this.renderGrid(ctx, totalW, totalH);

    // Render obstacles
    this.renderObstacles(ctx);

    // Render fruits
    this.renderFruits(ctx);

    // Render snake (smooth interpolated)
    this.renderSnake(ctx);

    // Render particles
    this.renderParticles(ctx);

    // Render floating score indicators
    this.renderFloatingTexts(ctx);

    // Border perimeter glow
    this.renderPerimeter(ctx, totalW, totalH);

    // Hit / damage flash overlay
    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, totalW, totalH);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  private renderGrid(ctx: CanvasRenderingContext2D, totalW: number, totalH: number) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;

    for (let c = 0; c <= this.cols; c++) {
      const x = c * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, totalH);
      ctx.stroke();
    }

    for (let r = 0; r <= this.rows; r++) {
      const y = r * this.cellSize;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(totalW, y);
      ctx.stroke();
    }
  }

  private renderPerimeter(ctx: CanvasRenderingContext2D, totalW: number, totalH: number) {
    const isWrap = this.mode === 'wrap';
    ctx.strokeStyle = isWrap ? 'rgba(56, 189, 248, 0.4)' : 'rgba(239, 68, 68, 0.35)';
    ctx.lineWidth = 2;

    if (isWrap) {
      ctx.setLineDash([6, 6]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.strokeRect(1, 1, totalW - 2, totalH - 2);
    ctx.setLineDash([]);
  }

  private renderObstacles(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      const px = obs.x * this.cellSize;
      const py = obs.y * this.cellSize;
      const cs = this.cellSize;

      ctx.save();
      // Stone / hazard block
      const grad = ctx.createLinearGradient(px, py, px + cs, py + cs);
      grad.addColorStop(0, '#475569');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.roundRect(px + 2, py + 2, cs - 4, cs - 4, 4);
      ctx.fill();

      // Sharp inner highlight
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderFruits(ctx: CanvasRenderingContext2D) {
    const time = performance.now() / 1000;

    for (const fruit of this.fruits) {
      const px = fruit.x * this.cellSize;
      const py = fruit.y * this.cellSize;
      const cs = this.cellSize;
      const cx = px + cs / 2;
      const cy = py + cs / 2;

      // Gentle floating bob
      const bob = Math.sin(time * 5 + fruit.x) * 1.5;

      ctx.save();
      ctx.translate(cx, cy + bob);

      if (fruit.type === 'apple') {
        // Red Ruby Apple with glow
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, cs * 0.8);
        glow.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        glow.addColorStop(0.6, 'rgba(239, 68, 68, 0.3)');
        glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, cs * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Apple body
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 1, cs * 0.36, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(-cs * 0.1, -cs * 0.1, cs * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Leaf
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(cs * 0.12, -cs * 0.32, cs * 0.14, cs * 0.08, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (fruit.type === 'golden') {
        // Pulsing Golden Star
        const pulse = 1 + Math.sin(time * 8) * 0.12;
        ctx.scale(pulse, pulse);

        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#facc15';
        this.drawStar(ctx, 0, 0, 5, cs * 0.42, cs * 0.2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sparkle center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, cs * 0.1, 0, Math.PI * 2);
        ctx.fill();
      } else if (fruit.type === 'pepper') {
        // Flame Pepper
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(0, 0, cs * 0.35, cs * 0.2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Pepper stem
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(-cs * 0.2, -cs * 0.2, cs * 0.08, 0, Math.PI * 2);
        ctx.fill();
      } else if (fruit.type === 'mint') {
        // Frost Diamond
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(0, -cs * 0.38);
        ctx.lineTo(cs * 0.32, 0);
        ctx.lineTo(0, cs * 0.38);
        ctx.lineTo(-cs * 0.32, 0);
        ctx.closePath();
        ctx.fill();

        // Inner white facet
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(0, 0, cs * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }

      // If temporary, draw expiring countdown circle
      if (fruit.duration) {
        const elapsed = performance.now() - fruit.spawnTime;
        const progress = Math.max(0, 1 - elapsed / fruit.duration);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, cs * 0.45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  private renderSnake(ctx: CanvasRenderingContext2D) {
    if (this.snake.length === 0) return;

    // Sub-tick interpolation factor (0 to 1) for buttery 60fps slither
    const effectiveInterval = Math.max(35, this.tickInterval);
    const alpha = Math.min(1, Math.max(0, this.accumulator / effectiveInterval));

    const cs = this.cellSize;

    // Draw connecting body segments
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const curr = this.snake[i];
      const prev = this.prevSnake[i] || curr;

      // Handle wrapping jump in interpolation
      let dx = curr.x - prev.x;
      let dy = curr.y - prev.y;
      if (Math.abs(dx) > 1) dx = 0;
      if (Math.abs(dy) > 1) dy = 0;

      const interpX = (prev.x + dx * alpha) * cs + cs / 2;
      const interpY = (prev.y + dy * alpha) * cs + cs / 2;

      ctx.save();
      ctx.translate(interpX, interpY);

      const isHead = i === 0;
      const segmentRatio = 1 - i / this.snake.length;
      const radius = (cs * 0.42) * (0.65 + 0.35 * segmentRatio);

      if (isHead) {
        // Glowing Viper Head
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = this.isBoosting ? 16 : 8;

        // Head gradient
        const headGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius);
        headGrad.addColorStop(0, '#34d399');
        headGrad.addColorStop(1, '#059669');
        ctx.fillStyle = headGrad;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Expressive Eyes facing direction of motion
        this.renderSnakeEyes(ctx, radius);
      } else {
        // Smooth connected body with gradient tone
        const bodyGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, radius);
        if (this.activePowerUp?.type === 'pepper') {
          bodyGrad.addColorStop(0, '#fb923c');
          bodyGrad.addColorStop(1, '#ea580c');
        } else if (this.activePowerUp?.type === 'mint') {
          bodyGrad.addColorStop(0, '#7dd3fc');
          bodyGrad.addColorStop(1, '#0284c7');
        } else {
          bodyGrad.addColorStop(0, '#10b981');
          bodyGrad.addColorStop(1, '#065f46');
        }

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle scale highlight on spine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderSnakeEyes(ctx: CanvasRenderingContext2D, headRadius: number) {
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;
    let pupilOffsetX = 0;
    let pupilOffsetY = 0;

    const eyeDistance = headRadius * 0.45;
    const eyeForward = headRadius * 0.35;
    const eyeRadius = headRadius * 0.28;
    const pupilRadius = headRadius * 0.16;

    let e1X = 0, e1Y = 0, e2X = 0, e2Y = 0;

    if (this.currentDir === 'RIGHT') {
      e1X = eyeForward; e1Y = -eyeDistance;
      e2X = eyeForward; e2Y = eyeDistance;
      pupilOffsetX = eyeRadius * 0.4;
    } else if (this.currentDir === 'LEFT') {
      e1X = -eyeForward; e1Y = -eyeDistance;
      e2X = -eyeForward; e2Y = eyeDistance;
      pupilOffsetX = -eyeRadius * 0.4;
    } else if (this.currentDir === 'UP') {
      e1X = -eyeDistance; e1Y = -eyeForward;
      e2X = eyeDistance; e2Y = -eyeForward;
      pupilOffsetY = -eyeRadius * 0.4;
    } else if (this.currentDir === 'DOWN') {
      e1X = -eyeDistance; e1Y = eyeForward;
      e2X = eyeDistance; e2Y = eyeForward;
      pupilOffsetY = eyeRadius * 0.4;
    }

    // Eye whites
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(e1X, e1Y, eyeRadius, 0, Math.PI * 2);
    ctx.arc(e2X, e2Y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Dark focused pupils
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(e1X + pupilOffsetX, e1Y + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
    ctx.arc(e2X + pupilOffsetX, e2Y + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pupil glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(e1X + pupilOffsetX - 1, e1Y + pupilOffsetY - 1, pupilRadius * 0.4, 0, Math.PI * 2);
    ctx.arc(e2X + pupilOffsetX - 1, e2Y + pupilOffsetY - 1, pupilRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Animated forked tongue flicker
    const time = performance.now() / 150;
    if (Math.sin(time) > 0.4) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const tongueLen = headRadius * 0.6;
      let tx = 0, ty = 0;
      if (this.currentDir === 'RIGHT') {
        tx = headRadius;
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx + tongueLen, 0);
        ctx.lineTo(tx + tongueLen + 3, -3);
        ctx.moveTo(tx + tongueLen, 0);
        ctx.lineTo(tx + tongueLen + 3, 3);
      } else if (this.currentDir === 'LEFT') {
        tx = -headRadius;
        ctx.moveTo(tx, 0);
        ctx.lineTo(tx - tongueLen, 0);
        ctx.lineTo(tx - tongueLen - 3, -3);
        ctx.moveTo(tx - tongueLen, 0);
        ctx.lineTo(tx - tongueLen - 3, 3);
      } else if (this.currentDir === 'UP') {
        ty = -headRadius;
        ctx.moveTo(0, ty);
        ctx.lineTo(0, ty - tongueLen);
        ctx.lineTo(-3, ty - tongueLen - 3);
        ctx.moveTo(0, ty - tongueLen);
        ctx.lineTo(3, ty - tongueLen - 3);
      } else if (this.currentDir === 'DOWN') {
        ty = headRadius;
        ctx.moveTo(0, ty);
        ctx.lineTo(0, ty + tongueLen);
        ctx.lineTo(-3, ty + tongueLen + 3);
        ctx.moveTo(0, ty + tongueLen);
        ctx.lineTo(3, ty + tongueLen + 3);
      }
      ctx.stroke();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  public destroy() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
