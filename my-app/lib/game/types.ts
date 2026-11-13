export type FruitKind =
  | "watermelon"
  | "orange"
  | "apple"
  | "banana"
  | "strawberry"
  | "pineapple"
  | "coconut";

export type EntityKind = FruitKind | "bomb";

export type GameStatus = "running" | "paused" | "over";

export type GameOverReason = "bomb" | "lives";

export interface GameStats {
  score: number;
  lives: number;
  maxLives: number;
}

export interface GameOverResult {
  score: number;
  reason: GameOverReason;
}

export interface EngineCallbacks {
  onStats: (stats: GameStats) => void;
  onGameOver: (result: GameOverResult) => void;
}

export interface ActiveFruit {
  id: number;
  kind: EntityKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  spin: number;
  age: number;
  gravity: number;
}

export interface FruitHalf {
  id: number;
  kind: FruitKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  spin: number;
  side: 0 | 1;
  age: number;
  gravity: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  drag: number;
  shape: "circle" | "spark" | "smoke";
  glow: boolean;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  age: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
}

export interface AmbientMote {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
}
