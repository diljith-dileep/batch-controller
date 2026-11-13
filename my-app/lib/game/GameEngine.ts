import { soundManager } from "./SoundManager";
import {
  BOMB_COLOR,
  BOMB_GLOW,
  FRUITS,
  FRUIT_KINDS,
  drawBomb,
  drawFruit,
  drawFruitHalf,
} from "./fruits";
import type {
  ActiveFruit,
  AmbientMote,
  EngineCallbacks,
  FloatingText,
  FruitHalf,
  FruitKind,
  GameOverReason,
  GameStatus,
  Particle,
  Shockwave,
  TrailPoint,
} from "./types";

const TAU = Math.PI * 2;
const MAX_LIVES = 3;
const COMBO_WINDOW = 0.65;
const BASE_GRAVITY = 1500;
const MAX_PARTICLES = 300;
const MAX_TRAIL_POINTS = 26;
const TRAIL_LIFETIME = 0.17;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickFruitKind(): FruitKind {
  return FRUIT_KINDS[Math.floor(Math.random() * FRUIT_KINDS.length)];
}

function distancePointToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(px - ax, py - ay);
  }

  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export class GameEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly callbacks: EngineCallbacks;
  private readonly resizeObserver: ResizeObserver | null;

  private width = 1;
  private height = 1;
  private dpr = 1;
  private backgroundCanvas: HTMLCanvasElement | null = null;

  private status: GameStatus = "running";
  private rafId: number | null = null;
  private lastTime = 0;
  private time = 0;
  private elapsed = 0;
  private destroyed = false;
  private ended = false;

  private score = 0;
  private lives = MAX_LIVES;
  private combo = 0;
  private lastSliceAt = -10;

  private fruits: ActiveFruit[] = [];
  private halves: FruitHalf[] = [];
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private trail: TrailPoint[] = [];
  private texts: FloatingText[] = [];
  private motes: AmbientMote[] = [];

  private spawnTimer = 1.1;
  private pointerDown = false;
  private activePointerId: number | null = null;
  private previousPoint: { x: number; y: number } | null = null;

  private shakeTime = 0;
  private shakeMagnitude = 0;
  private flash = 0;
  private damageFlash = 0;

  private nextId = 1;
  private timeouts: number[] = [];

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("2D canvas context is not available");
    }
    this.ctx = context;

    this.resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => this.handleResize())
        : null;
    this.resizeObserver?.observe(canvas);

    this.handleResize();
    this.attachInputListeners();
  }

  start(): void {
    if (this.rafId !== null) return;
    this.status = "running";
    this.lastTime = performance.now();
    this.emitStats();
    this.rafId = requestAnimationFrame(this.loop);
  }

  pause(): void {
    if (this.status === "running") {
      this.status = "paused";
      this.pointerDown = false;
      this.activePointerId = null;
      this.previousPoint = null;
    }
  }

  resume(): void {
    if (this.status === "paused") {
      this.status = "running";
      this.lastTime = performance.now();
    }
  }

  destroy(): void {
    this.destroyed = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.resizeObserver?.disconnect();
    this.detachInputListeners();
    for (const timeout of this.timeouts) {
      window.clearTimeout(timeout);
    }
    this.timeouts = [];
  }

  private loop = (timestamp: number): void => {
    if (this.destroyed) return;

    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    dt = Math.min(dt, 0.05);

    this.update(dt);
    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    this.time += dt;

    if (this.status === "paused") return;

    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.damageFlash = Math.max(0, this.damageFlash - dt * 2.2);
    this.shakeTime = Math.max(0, this.shakeTime - dt);

    for (const point of this.trail) {
      point.age += dt;
    }
    if (this.trail.length > 0 && this.trail[0].age > TRAIL_LIFETIME) {
      this.trail = this.trail.filter((point) => point.age <= TRAIL_LIFETIME);
    }

    if (this.status === "running") {
      this.elapsed += dt;
      this.updateWholeFruits(dt, true);
      this.updateEffects(dt);

      if (this.status === "running") {
        this.updateSpawner(dt);

        if (this.combo > 0 && this.elapsed - this.lastSliceAt > COMBO_WINDOW) {
          this.combo = 0;
        }
      }
    } else if (this.status === "over") {
      this.updateWholeFruits(dt, false);
      this.updateEffects(dt);
    }
  }

  private updateSpawner(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;

    const difficulty = clamp(this.elapsed / 95, 0, 1);
    const speedFactor = 1 + difficulty * 0.65;
    const gravity = BASE_GRAVITY * speedFactor * speedFactor;

    const waveSize = clamp(
      1 + Math.floor(Math.random() * (1.2 + difficulty * 3.4)),
      1,
      5,
    );

    for (let i = 0; i < waveSize; i += 1) {
      this.spawnFruit(gravity, pickFruitKind());
    }

    if (this.elapsed > 6) {
      const bombChance = clamp(
        0.055 + difficulty * 0.17 + this.score / 4500,
        0,
        0.36,
      );
      if (Math.random() < bombChance) {
        this.spawnFruit(gravity, "bomb");
      }
      if (difficulty > 0.55 && Math.random() < bombChance * 0.45) {
        this.spawnFruit(gravity, "bomb");
      }
    }

    const interval = clamp(1.55 - difficulty * 0.9, 0.56, 1.6) * rand(0.82, 1.16);
    this.spawnTimer = interval;
  }

  private unitRadius(): number {
    return clamp(Math.min(this.width, this.height) * 0.078, 24, 47);
  }

  private spawnFruit(gravity: number, kind: FruitKind | "bomb"): void {
    if (this.width < 2 || this.height < 2) return;

    const radius =
      this.unitRadius() * (kind === "bomb" ? 1.02 : FRUITS[kind].radiusScale);
    const x = rand(this.width * 0.1 + radius, this.width * 0.9 - radius);
    const rise = this.height * rand(0.46, 0.82);
    const vy = -Math.sqrt(2 * gravity * rise);
    const flightTime = (2 * Math.abs(vy)) / gravity;
    const aim = this.width * rand(0.28, 0.72);
    const vx = (aim - x) / Math.max(flightTime, 0.2);

    const fruit: ActiveFruit = {
      id: this.nextId++,
      kind,
      x,
      y: this.height + radius + rand(8, 40),
      vx,
      vy,
      radius,
      rotation: rand(0, TAU),
      spin: rand(-3.2, 3.2),
      age: 0,
      gravity,
    };

    this.fruits.push(fruit);
  }

  private updateWholeFruits(dt: number, countMisses: boolean): void {
    for (let i = this.fruits.length - 1; i >= 0; i -= 1) {
      const fruit = this.fruits[i];
      fruit.age += dt;
      fruit.vy += fruit.gravity * dt;
      fruit.x += fruit.vx * dt;
      fruit.y += fruit.vy * dt;
      fruit.rotation += fruit.spin * dt;

      const isBomb = fruit.kind === "bomb";

      if (fruit.y - fruit.radius > this.height + 120 && fruit.vy > 0) {
        this.fruits.splice(i, 1);
        if (countMisses && !isBomb) {
          this.loseLife(fruit);
          if (this.status !== "running") return;
        }
        continue;
      }

      if (
        fruit.age > 0.4 &&
        (fruit.x + fruit.radius < -40 || fruit.x - fruit.radius > this.width + 40)
      ) {
        this.fruits.splice(i, 1);
        if (countMisses && !isBomb) {
          this.loseLife(fruit);
          if (this.status !== "running") return;
        }
      }
    }
  }

  private loseLife(fruit: ActiveFruit): void {
    if (this.status !== "running") return;

    this.lives -= 1;
    this.damageFlash = 1;
    this.shakeTime = 0.24;
    this.shakeMagnitude = 7;
    this.combo = 0;
    soundManager.fall();

    this.texts.push({
      x: clamp(fruit.x, 40, this.width - 40),
      y: clamp(fruit.y, this.height * 0.3, this.height - 70),
      vy: -46,
      life: 1,
      maxLife: 1,
      text: "MISS -1",
      color: "#fb7185",
      size: clamp(this.width * 0.038, 18, 28),
    });

    this.emitStats();

    if (this.lives <= 0) {
      this.lives = 0;
      this.endGame("lives", 500);
    }
  }

  private updateEffects(dt: number): void {
    for (let i = this.halves.length - 1; i >= 0; i -= 1) {
      const half = this.halves[i];
      half.age += dt;
      half.vy += half.gravity * dt;
      half.x += half.vx * dt;
      half.y += half.vy * dt;
      half.rotation += half.spin * dt;

      if (half.y - half.radius > this.height + 180 || half.age > 6) {
        this.halves.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const damping = Math.pow(particle.drag, dt * 60);
      particle.vx *= damping;
      particle.vy = particle.vy * damping + particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;

      if (
        particle.y - particle.size > this.height + 200 ||
        particle.x < -200 ||
        particle.x > this.width + 200
      ) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i -= 1) {
      const wave = this.shockwaves[i];
      wave.life -= dt;
      if (wave.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = 1 - wave.life / wave.maxLife;
      wave.radius = wave.maxRadius * Math.sqrt(progress);
    }

    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      const text = this.texts[i];
      text.life -= dt;
      text.y += text.vy * dt;
      if (text.life <= 0) {
        this.texts.splice(i, 1);
      }
    }

    for (const mote of this.motes) {
      mote.y -= mote.speed * dt;
      mote.x += Math.sin(this.time * 0.6 + mote.phase) * mote.drift * dt;
      if (mote.y < -10) {
        mote.y = this.height + 10;
        mote.x = rand(0, this.width);
      }
    }
  }

  private emitStats(): void {
    this.callbacks.onStats({
      score: this.score,
      lives: this.lives,
      maxLives: MAX_LIVES,
    });
  }

  private sliceSegment(ax: number, ay: number, bx: number, by: number): void {
    if (this.status !== "running") return;

    for (let i = this.fruits.length - 1; i >= 0; i -= 1) {
      const fruit = this.fruits[i];
      if (fruit.kind !== "bomb") continue;

      const distance = distancePointToSegment(
        fruit.x,
        fruit.y,
        ax,
        ay,
        bx,
        by,
      );
      if (distance <= fruit.radius * 0.82) {
        this.explodeBomb(fruit);
        return;
      }
    }

    const sliced: ActiveFruit[] = [];
    for (let i = this.fruits.length - 1; i >= 0; i -= 1) {
      const fruit = this.fruits[i];
      const distance = distancePointToSegment(
        fruit.x,
        fruit.y,
        ax,
        ay,
        bx,
        by,
      );
      if (distance <= fruit.radius * 0.92) {
        this.fruits.splice(i, 1);
        sliced.push(fruit);
      }
    }

    for (let i = sliced.length - 1; i >= 0; i -= 1) {
      this.sliceFruit(sliced[i], ax, ay, bx, by);
    }
  }

  private sliceFruit(
    fruit: ActiveFruit,
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): void {
    if (fruit.kind === "bomb") return;
    const definition = FRUITS[fruit.kind];

    const quick = this.elapsed - this.lastSliceAt <= COMBO_WINDOW;
    this.combo = quick ? this.combo + 1 : 1;
    this.lastSliceAt = this.elapsed;

    const bonus = this.combo >= 2 ? (this.combo - 1) * 5 : 0;
    const points = definition.points + bonus;
    this.score += points;

    if (this.combo >= 2) {
      soundManager.combo();
    } else {
      soundManager.slice();
    }

    this.spawnSliceHalves(fruit, ax, ay, bx, by);
    this.spawnJuice(fruit.x, fruit.y, definition.color, this.combo);

    const textSize = clamp(this.width * 0.034, 17, 30);
    this.texts.push({
      x: fruit.x,
      y: fruit.y - fruit.radius * 0.4,
      vy: -62,
      life: 0.9,
      maxLife: 0.9,
      text: `+${points}`,
      color: definition.color,
      size: textSize,
    });

    if (this.combo >= 2) {
      this.texts.push({
        x: fruit.x,
        y: fruit.y - fruit.radius - 22,
        vy: -46,
        life: 1.1,
        maxLife: 1.1,
        text: `COMBO x${this.combo}`,
        color: "#fef08a",
        size: clamp(this.width * 0.04, 19, 33),
      });
    }

    this.emitStats();
  }

  private spawnSliceHalves(
    fruit: ActiveFruit,
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): void {
    if (fruit.kind === "bomb") return;

    const cutAngle = Math.atan2(by - ay, bx - ax);
    const normalX = -Math.sin(cutAngle);
    const normalY = Math.cos(cutAngle);
    const separation = 120 + Math.min(this.combo, 6) * 12;

    for (const side of [0, 1] as const) {
      const direction = side === 0 ? -1 : 1;
      const half: FruitHalf = {
        id: this.nextId++,
        kind: fruit.kind,
        x: fruit.x + normalX * direction * fruit.radius * 0.18,
        y: fruit.y + normalY * direction * fruit.radius * 0.18,
        vx: fruit.vx + normalX * direction * separation,
        vy: fruit.vy + normalY * direction * separation - 60,
        radius: fruit.radius,
        rotation: cutAngle,
        spin: fruit.spin + direction * rand(1.5, 4.5),
        side,
        age: 0,
        gravity: fruit.gravity,
      };
      this.halves.push(half);
    }
  }

  private spawnJuice(x: number, y: number, color: string, combo: number): void {
    const count = 16 + Math.min(combo, 5) * 3;

    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(60, 420) * (1 + combo * 0.05);
      const life = rand(0.35, 0.95);
      this.particles.push({
        x: x + rand(-6, 6),
        y: y + rand(-6, 6),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(0, 150),
        life,
        maxLife: life,
        size: rand(2.5, 8),
        color,
        gravity: 950,
        drag: 0.985,
        shape: "circle",
        glow: false,
      });
    }

    for (let i = 0; i < 4; i += 1) {
      const angle = rand(0, TAU);
      const life = rand(0.5, 1.1);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * rand(20, 130),
        vy: Math.sin(angle) * rand(20, 130),
        life,
        maxLife: life,
        size: rand(9, 17),
        color,
        gravity: 500,
        drag: 0.975,
        shape: "circle",
        glow: false,
      });
    }

    for (let i = 0; i < 7; i += 1) {
      const angle = rand(0, TAU);
      const life = rand(0.2, 0.55);
      this.particles.push({
        x: x + rand(-10, 10),
        y: y + rand(-10, 10),
        vx: Math.cos(angle) * rand(90, 360),
        vy: Math.sin(angle) * rand(90, 360),
        life,
        maxLife: life,
        size: rand(1.5, 3.6),
        color: "#ffffff",
        gravity: 420,
        drag: 0.99,
        shape: "spark",
        glow: true,
      });
    }

    this.trimParticles();
  }

  private trimParticles(): void {
    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    }
  }

  private explodeBomb(bomb: ActiveFruit): void {
    if (this.status === "over") return;

    const index = this.fruits.indexOf(bomb);
    if (index >= 0) {
      this.fruits.splice(index, 1);
    }

    soundManager.bomb();
    this.flash = 1;
    this.damageFlash = 0.8;
    this.shakeTime = 0.6;
    this.shakeMagnitude = 24;
    this.combo = 0;

    for (let i = 0; i < 46; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(120, 900);
      const life = rand(0.3, 1.05);
      this.particles.push({
        x: bomb.x,
        y: bomb.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: rand(2, 7),
        color: Math.random() < 0.45 ? "#fde047" : Math.random() < 0.5 ? "#f97316" : "#ef4444",
        gravity: 520,
        drag: 0.985,
        shape: "spark",
        glow: true,
      });
    }

    for (let i = 0; i < 18; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(20, 230);
      const life = rand(0.7, 1.6);
      this.particles.push({
        x: bomb.x + rand(-10, 10),
        y: bomb.y + rand(-10, 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(20, 90),
        life,
        maxLife: life,
        size: rand(14, 36),
        color: "#1c1c24",
        gravity: -70,
        drag: 0.96,
        shape: "smoke",
        glow: false,
      });
    }

    this.shockwaves.push(
      {
        x: bomb.x,
        y: bomb.y,
        radius: 0,
        maxRadius: Math.min(this.width, this.height) * 0.42,
        life: 0.55,
        maxLife: 0.55,
        color: BOMB_COLOR,
        width: 12,
      },
      {
        x: bomb.x,
        y: bomb.y,
        radius: 0,
        maxRadius: Math.min(this.width, this.height) * 0.28,
        life: 0.4,
        maxLife: 0.4,
        color: "#fde68a",
        width: 6,
      },
    );

    this.texts.push({
      x: bomb.x,
      y: bomb.y - 20,
      vy: -34,
      life: 1.2,
      maxLife: 1.2,
      text: "BOOM!",
      color: "#fb923c",
      size: clamp(this.width * 0.06, 28, 52),
    });

    this.trimParticles();
    this.endGame("bomb", 700);
  }

  private endGame(reason: GameOverReason, delay: number): void {
    if (this.ended) return;
    this.ended = true;
    this.status = "over";
    this.pointerDown = false;
    this.activePointerId = null;
    this.previousPoint = null;
    this.combo = 0;

    const finalScore = this.score;
    const finish = () => {
      soundManager.gameOver();
      this.callbacks.onGameOver({ score: finalScore, reason });
    };

    if (delay <= 0) {
      finish();
    } else {
      const timeout = window.setTimeout(finish, delay);
      this.timeouts.push(timeout);
    }
  }

  private attachInputListeners(): void {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove, {
      passive: false,
    });
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerUp);
    this.canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  private detachInputListeners(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerUp);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
  }

  private onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  private pointerPosition(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.status !== "running") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const point = this.pointerPosition(event);
    this.pointerDown = true;
    this.activePointerId = event.pointerId;
    this.previousPoint = point;
    this.pushTrailPoint(point.x, point.y);

    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture can fail for synthetic pointers; slicing still works.
    }

    event.preventDefault();
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return;
    }

    const point = this.pointerPosition(event);
    this.pushTrailPoint(point.x, point.y);

    if (this.pointerDown) {
      const previous = this.previousPoint ?? point;
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
      if (distance > 1.5) {
        this.sliceSegment(previous.x, previous.y, point.x, point.y);
      }
      this.previousPoint = point;
      event.preventDefault();
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return;
    }
    this.pointerDown = false;
    this.activePointerId = null;
    this.previousPoint = null;

    try {
      if (this.canvas.hasPointerCapture(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore capture release failures.
    }
  };

  private pushTrailPoint(x: number, y: number): void {
    this.trail.push({ x, y, age: 0 });
    if (this.trail.length > MAX_TRAIL_POINTS) {
      this.trail.shift();
    }
  }

  private handleResize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const oldWidth = this.width;
    const oldHeight = this.height;
    const changed = cssWidth !== oldWidth || cssHeight !== oldHeight;

    this.width = cssWidth;
    this.height = cssHeight;
    this.dpr = dpr;

    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }

    this.buildBackground();

    if (oldWidth > 1 && oldHeight > 1 && changed) {
      const scaleX = cssWidth / oldWidth;
      const scaleY = cssHeight / oldHeight;
      const radiusScale = Math.min(scaleX, scaleY);

      for (const fruit of this.fruits) {
        fruit.x *= scaleX;
        fruit.y *= scaleY;
        fruit.vx *= scaleX;
        fruit.vy *= scaleY;
        fruit.radius *= radiusScale;
      }
      for (const half of this.halves) {
        half.x *= scaleX;
        half.y *= scaleY;
        half.vx *= scaleX;
        half.vy *= scaleY;
        half.radius *= radiusScale;
      }
      for (const particle of this.particles) {
        particle.x *= scaleX;
        particle.y *= scaleY;
      }
      this.trail = [];
    }

    if (this.motes.length === 0 || changed) {
      this.motes = Array.from({ length: 26 }, () => ({
        x: rand(0, this.width),
        y: rand(0, this.height),
        radius: rand(0.6, 2.3),
        speed: rand(4, 20),
        drift: rand(-9, 9),
        phase: rand(0, TAU),
        alpha: rand(0.08, 0.32),
      }));
    }
  }

  private buildBackground(): void {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = this.width;
    const height = this.height;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const base = ctx.createLinearGradient(0, 0, width * 0.35, height);
    base.addColorStop(0, "#06030f");
    base.addColorStop(0.45, "#0a0718");
    base.addColorStop(0.78, "#100a24");
    base.addColorStop(1, "#07040f");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    const glows: Array<[number, number, number, string]> = [
      [width * 0.18, height * 0.08, Math.max(width, height) * 0.55, "rgba(124, 58, 237, 0.28)"],
      [width * 0.88, height * 0.72, Math.max(width, height) * 0.5, "rgba(34, 211, 238, 0.16)"],
      [width * 0.52, height * 1.02, Math.max(width, height) * 0.55, "rgba(236, 72, 153, 0.16)"],
      [width * 0.04, height * 0.86, Math.max(width, height) * 0.34, "rgba(34, 197, 94, 0.09)"],
    ];

    for (const [x, y, radius, color] of glows) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, color);
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    const streak = ctx.createLinearGradient(width * 0.1, 0, width * 0.9, height);
    streak.addColorStop(0, "rgba(34, 211, 238, 0)");
    streak.addColorStop(0.5, "rgba(34, 211, 238, 0.04)");
    streak.addColorStop(1, "rgba(217, 70, 239, 0)");
    ctx.fillStyle = streak;
    ctx.beginPath();
    ctx.moveTo(width * 0.05, 0);
    ctx.lineTo(width * 0.32, 0);
    ctx.lineTo(width * 0.95, height);
    ctx.lineTo(width * 0.68, height);
    ctx.closePath();
    ctx.fill();

    let seed = 20260214;
    const seeded = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < 34; i += 1) {
      const x = seeded() * width;
      const y = seeded() * height;
      const radius = 0.8 + seeded() * 2.6;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.fillStyle =
        seeded() > 0.5
          ? `rgba(103, 232, 249, ${0.04 + seeded() * 0.1})`
          : `rgba(192, 132, 252, ${0.03 + seeded() * 0.09})`;
      ctx.fill();
    }

    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.46,
      Math.min(width, height) * 0.2,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.78,
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(0.72, "rgba(0, 0, 0, 0.12)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.58)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    this.backgroundCanvas = canvas;
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTime > 0) {
      const intensity = this.shakeMagnitude * (this.shakeTime / 0.6);
      shakeX = rand(-intensity, intensity);
      shakeY = rand(-intensity, intensity);
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (this.backgroundCanvas) {
      ctx.drawImage(this.backgroundCanvas, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#06030f";
      ctx.fillRect(0, 0, this.width, this.height);
    }

    this.renderMotes(ctx);
    this.renderHalves(ctx);
    this.renderFruits(ctx);
    this.renderParticles(ctx);
    this.renderShockwaves(ctx);
    this.renderTrail(ctx);
    this.renderTexts(ctx);

    ctx.restore();

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 156, 64, ${this.flash * 0.5})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    if (this.damageFlash > 0) {
      const gradient = ctx.createRadialGradient(
        this.width * 0.5,
        this.height * 0.5,
        Math.min(this.width, this.height) * 0.1,
        this.width * 0.5,
        this.height * 0.5,
        Math.max(this.width, this.height) * 0.7,
      );
      gradient.addColorStop(0, "rgba(239, 68, 68, 0)");
      gradient.addColorStop(1, `rgba(239, 68, 68, ${this.damageFlash * 0.4})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private renderMotes(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const mote of this.motes) {
      ctx.globalAlpha = mote.alpha;
      ctx.fillStyle = "#67e8f9";
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.radius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderHalves(ctx: CanvasRenderingContext2D): void {
    for (const half of this.halves) {
      ctx.save();
      ctx.globalAlpha = half.age > 4.2 ? clamp(1 - (half.age - 4.2) / 1.8, 0, 1) : 1;
      ctx.translate(half.x, half.y);
      ctx.rotate(half.rotation);
      drawFruitHalf(ctx, half.kind, half.radius, half.side);
      ctx.restore();
    }
  }

  private renderFruits(ctx: CanvasRenderingContext2D): void {
    for (const fruit of this.fruits) {
      ctx.save();
      ctx.translate(fruit.x, fruit.y);

      if (fruit.kind === "bomb") {
        ctx.save();
        ctx.shadowColor = BOMB_GLOW;
        ctx.shadowBlur = fruit.radius * 0.55;
        ctx.rotate(fruit.rotation * 0.25);
        drawBomb(ctx, fruit.radius, this.time);
        ctx.restore();
      } else {
        ctx.rotate(fruit.rotation);
        drawFruit(ctx, fruit.kind, fruit.radius);
      }

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const particle of this.particles) {
      const progress = clamp(particle.life / particle.maxLife, 0, 1);

      if (particle.shape === "smoke") {
        ctx.globalAlpha = progress * 0.42;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1.4 - progress * 0.4), 0, TAU);
        ctx.fill();
        continue;
      }

      ctx.globalAlpha = particle.shape === "spark" ? progress : Math.min(1, progress * 1.4);
      ctx.globalCompositeOperation = particle.glow ? "lighter" : "source-over";
      ctx.fillStyle = particle.color;

      if (particle.shape === "spark") {
        ctx.save();
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.size * 3;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * progress, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (0.6 + progress * 0.5), 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private renderShockwaves(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const wave of this.shockwaves) {
      const progress = clamp(wave.life / wave.maxLife, 0, 1);
      ctx.globalAlpha = progress;
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = Math.max(1, wave.width * progress);
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderTrail(ctx: CanvasRenderingContext2D): void {
    const points = this.trail;
    if (points.length < 2) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 1; i < points.length; i += 1) {
        const previous = points[i - 1];
        const current = points[i];
        const progress = i / (points.length - 1);
        const freshness = 1 - clamp(current.age / TRAIL_LIFETIME, 0, 1);
        if (freshness <= 0) continue;

        if (pass === 0) {
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = `rgba(217, 70, 239, ${0.05 + progress * 0.12 * freshness})`;
          ctx.lineWidth = (3 + progress * 10) * 2.2;
          ctx.shadowColor = "rgba(34, 211, 238, 0.85)";
          ctx.shadowBlur = 16;
        } else {
          ctx.globalCompositeOperation = "source-over";
          const alpha = (0.18 + progress * 0.6) * freshness;
          ctx.strokeStyle = `rgba(240, 253, 255, ${alpha})`;
          ctx.lineWidth = (1.4 + progress * 5.5) * (this.pointerDown ? 1 : 0.72);
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private renderTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const text of this.texts) {
      const progress = clamp(text.life / text.maxLife, 0, 1);
      ctx.globalAlpha = progress;
      ctx.font = `900 ${text.size}px "Arial Black", "Segoe UI Black", Impact, sans-serif`;
      ctx.lineWidth = Math.max(3, text.size * 0.16);
      ctx.strokeStyle = "rgba(3, 2, 10, 0.72)";
      ctx.strokeText(text.text, text.x, text.y);
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);
    }
    ctx.restore();
  }
}
