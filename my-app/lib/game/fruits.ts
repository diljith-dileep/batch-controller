import type { FruitKind } from "./types";

const TAU = Math.PI * 2;

type DrawFn = (ctx: CanvasRenderingContext2D, r: number) => void;

interface FruitDefinition {
  kind: FruitKind;
  label: string;
  emoji: string;
  color: string;
  glow: string;
  flesh: string;
  fleshDark: string;
  rind: string;
  radiusScale: number;
  points: number;
  drawBody: DrawFn;
  drawWhole: DrawFn;
  drawInterior: DrawFn;
}

function circlePath(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
}

function applePath(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.7);
  ctx.bezierCurveTo(-r * 0.5, -r * 0.98, -r * 1.02, -r * 0.34, -r * 0.9, r * 0.14);
  ctx.bezierCurveTo(-r * 0.82, r * 0.86, -r * 0.26, r * 1.02, 0, r * 0.8);
  ctx.bezierCurveTo(r * 0.26, r * 1.02, r * 0.82, r * 0.86, r * 0.9, r * 0.14);
  ctx.bezierCurveTo(r * 1.02, -r * 0.34, r * 0.5, -r * 0.98, 0, -r * 0.7);
  ctx.closePath();
}

function bananaPath(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.moveTo(-r * 0.98, -r * 0.3);
  ctx.quadraticCurveTo(-r * 0.15, r * 1.42, r * 0.92, r * 0.42);
  ctx.quadraticCurveTo(r * 1.05, r * 0.3, r * 0.98, r * 0.18);
  ctx.quadraticCurveTo(r * 0.12, r * 0.92, -r * 0.82, -r * 0.42);
  ctx.quadraticCurveTo(-r * 0.94, -r * 0.52, -r * 0.98, -r * 0.3);
  ctx.closePath();
}

function strawberryPath(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.78);
  ctx.bezierCurveTo(r * 0.64, -r * 0.98, r * 0.98, -r * 0.12, r * 0.66, r * 0.42);
  ctx.bezierCurveTo(r * 0.46, r * 0.82, r * 0.18, r * 0.98, 0, r * 1.02);
  ctx.bezierCurveTo(-r * 0.18, r * 0.98, -r * 0.46, r * 0.82, -r * 0.66, r * 0.42);
  ctx.bezierCurveTo(-r * 0.98, -r * 0.12, -r * 0.64, -r * 0.98, 0, -r * 0.78);
  ctx.closePath();
}

function pineapplePath(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.ellipse(0, r * 0.06, r * 0.74, r * 0.94, 0, 0, TAU);
}

function radialFill(
  ctx: CanvasRenderingContext2D,
  r: number,
  inner: string,
  mid: string,
  outer: string,
): CanvasGradient {
  const gradient = ctx.createRadialGradient(-r * 0.34, -r * 0.4, r * 0.06, 0, 0, r * 1.2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.55, mid);
  gradient.addColorStop(1, outer);
  return gradient;
}

function paintBody(
  ctx: CanvasRenderingContext2D,
  r: number,
  inner: string,
  mid: string,
  outer: string,
): void {
  ctx.fillStyle = radialFill(ctx, r, inner, mid, outer);
  ctx.fill();
}

function highlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotation: number,
  alpha = 0.3,
): void {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, TAU);
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fill();
}

const WATERMELON_SEEDS: ReadonlyArray<readonly [number, number]> = [
  [-0.34, -0.5], [0.18, -0.56], [0.44, -0.16], [-0.14, -0.1],
  [-0.52, 0.08], [0.22, 0.24], [-0.2, 0.5], [0.46, 0.46],
  [0.02, 0.78], [-0.56, -0.22], [0.62, 0.12], [-0.4, 0.3],
];

const STRAWBERRY_SEEDS: ReadonlyArray<readonly [number, number]> = [
  [0, -0.45], [-0.34, -0.26], [0.34, -0.26], [-0.18, 0],
  [0.18, 0], [-0.45, 0.12], [0.45, 0.12], [-0.26, 0.4],
  [0.26, 0.4], [0, 0.22], [0, 0.66], [-0.1, 0.86], [0.12, 0.9],
];

function drawWatermelonWhole(ctx: CanvasRenderingContext2D, r: number): void {
  circlePath(ctx, r);
  paintBody(ctx, r, "#8ef06a", "#34bc4e", "#0b5a2b");

  ctx.save();
  circlePath(ctx, r);
  ctx.clip();
  ctx.strokeStyle = "rgba(4, 58, 25, 0.55)";
  ctx.lineWidth = r * 0.1;
  ctx.lineCap = "round";
  for (let i = -2; i <= 2; i += 1) {
    const x = i * r * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, -r * 1.05);
    ctx.quadraticCurveTo(x + r * 0.18, -r * 0.3, x, 0);
    ctx.quadraticCurveTo(x + r * 0.18, r * 0.5, x - r * 0.06, r * 1.05);
    ctx.stroke();
  }
  ctx.restore();

  highlight(ctx, -r * 0.36, -r * 0.42, r * 0.26, r * 0.14, -0.6, 0.28);

  ctx.strokeStyle = "#1f5a2a";
  ctx.lineWidth = r * 0.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.98);
  ctx.quadraticCurveTo(r * 0.12, -r * 1.2, r * 0.28, -r * 1.16);
  ctx.stroke();
}

function drawWatermelonInterior(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = radialFill(ctx, r, "#ff8d9f", "#ff4b62", "#c8143c");
  ctx.fill();
  highlight(ctx, 0, -r * 0.1, r * 0.5, r * 0.42, 0, 0.16);

  ctx.fillStyle = "#f9fafb";
  for (const [sx, sy] of WATERMELON_SEEDS) {
    ctx.save();
    ctx.translate(sx * r, sy * r);
    ctx.rotate(sx * 0.8);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.045, r * 0.075, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawOrangeWhole(ctx: CanvasRenderingContext2D, r: number): void {
  circlePath(ctx, r);
  paintBody(ctx, r, "#ffd27a", "#ff9a1f", "#c94e00");

  ctx.fillStyle = "rgba(168, 63, 0, 0.22)";
  for (let i = 0; i < 16; i += 1) {
    const angle = i * 2.399;
    const distance = r * (0.14 + ((i * 37) % 100) / 130);
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, r * 0.032, 0, TAU);
    ctx.fill();
  }

  highlight(ctx, -r * 0.36, -r * 0.42, r * 0.25, r * 0.14, -0.55, 0.32);

  ctx.fillStyle = "#2f8f3a";
  ctx.beginPath();
  ctx.ellipse(r * 0.3, -r * 0.96, r * 0.24, r * 0.11, -0.55, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#1f5a2a";
  ctx.lineWidth = r * 0.06;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.98);
  ctx.lineTo(r * 0.08, -r * 1.14);
  ctx.stroke();
}

function drawOrangeInterior(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = radialFill(ctx, r, "#ffd08a", "#ffa63a", "#e86a00");
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 247, 229, 0.55)";
  ctx.lineWidth = r * 0.035;
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.08, Math.sin(angle) * r * 0.08);
    ctx.lineTo(Math.cos(angle) * r * 0.78, Math.sin(angle) * r * 0.78);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0, TAU);
  ctx.fillStyle = "rgba(255, 241, 214, 0.8)";
  ctx.fill();
}

function drawAppleWhole(ctx: CanvasRenderingContext2D, r: number): void {
  applePath(ctx, r);
  paintBody(ctx, r, "#ff8a8a", "#e8263b", "#8d0718");

  ctx.save();
  applePath(ctx, r);
  ctx.clip();
  ctx.fillStyle = "rgba(255, 230, 120, 0.2)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.46, r * 0.16, r * 0.4, r * 0.62, 0.25, 0, TAU);
  ctx.fill();
  ctx.restore();

  highlight(ctx, -r * 0.34, -r * 0.4, r * 0.2, r * 0.11, -0.7, 0.35);

  ctx.strokeStyle = "#5b3218";
  ctx.lineWidth = r * 0.1;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.8);
  ctx.quadraticCurveTo(r * 0.04, -r * 1.02, r * 0.14, -r * 1.1);
  ctx.stroke();

  ctx.fillStyle = "#3c9a43";
  ctx.beginPath();
  ctx.ellipse(r * 0.32, -r * 0.96, r * 0.22, r * 0.1, -0.4, 0, TAU);
  ctx.fill();
}

function drawAppleInterior(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = radialFill(ctx, r, "#fff8e2", "#f5ecc9", "#dcc98f");
  ctx.fill();

  ctx.fillStyle = "rgba(219, 195, 128, 0.65)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.02, r * 0.2, r * 0.28, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#5b3218";
  ctx.beginPath();
  ctx.ellipse(-r * 0.07, -r * 0.04, r * 0.035, r * 0.06, 0.3, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 0.07, r * 0.08, r * 0.035, r * 0.06, -0.3, 0, TAU);
  ctx.fill();
}

function drawBananaWhole(ctx: CanvasRenderingContext2D, r: number): void {
  bananaPath(ctx, r);
  paintBody(ctx, r, "#fff6a5", "#ffd93b", "#b98200");

  ctx.save();
  bananaPath(ctx, r);
  ctx.clip();
  ctx.strokeStyle = "rgba(150, 98, 0, 0.32)";
  ctx.lineWidth = r * 0.05;
  for (let i = 1; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-r * (0.9 - i * 0.14), -r * 0.22 + i * r * 0.06);
    ctx.quadraticCurveTo(-r * 0.05, r * (1.08 - i * 0.12), r * (0.86 - i * 0.1), r * (0.34 - i * 0.04));
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "#6b4a10";
  ctx.beginPath();
  ctx.ellipse(-r * 0.9, -r * 0.3, r * 0.1, r * 0.07, -0.5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(r * 0.94, r * 0.3, r * 0.09, r * 0.06, -0.35, 0, TAU);
  ctx.fill();
}

function drawBananaInterior(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = radialFill(ctx, r, "#fffdf0", "#fff4c2", "#e8d789");
  ctx.fill();

  ctx.strokeStyle = "rgba(212, 190, 120, 0.72)";
  ctx.lineWidth = r * 0.035;
  ctx.beginPath();
  ctx.moveTo(-r * 0.66, -r * 0.06);
  ctx.quadraticCurveTo(-r * 0.05, r * 0.82, r * 0.68, r * 0.24);
  ctx.stroke();

  ctx.fillStyle = "rgba(90, 70, 30, 0.5)";
  for (let i = 0; i < 5; i += 1) {
    const x = -r * 0.4 + i * r * 0.2;
    ctx.beginPath();
    ctx.arc(x, r * 0.24 + Math.sin(i) * r * 0.08, r * 0.022, 0, TAU);
    ctx.fill();
  }
}

function drawStrawberryWhole(ctx: CanvasRenderingContext2D, r: number): void {
  strawberryPath(ctx, r);
  paintBody(ctx, r, "#ff9a95", "#f2233f", "#9c0a22");

  ctx.save();
  strawberryPath(ctx, r);
  ctx.clip();
  highlight(ctx, -r * 0.28, -r * 0.28, r * 0.2, r * 0.32, 0.2, 0.24);
  ctx.restore();

  ctx.fillStyle = "#ffe9a6";
  for (const [sx, sy] of STRAWBERRY_SEEDS) {
    ctx.beginPath();
    ctx.ellipse(sx * r, sy * r, r * 0.035, r * 0.055, 0.2, 0, TAU);
    ctx.fill();
  }

  ctx.fillStyle = "#2f8f3a";
  for (let i = 0; i < 5; i += 1) {
    const angle = -Math.PI / 2 + (i - 2) * 0.42;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(angle) * r * 0.3,
      -r * 0.88 + Math.sin(angle) * r * 0.1,
      r * 0.24,
      r * 0.08,
      angle + Math.PI / 2,
      0,
      TAU,
    );
    ctx.fill();
  }
  ctx.strokeStyle = "#1f5a2a";
  ctx.lineWidth = r * 0.07;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.9);
  ctx.lineTo(0, -r * 1.12);
  ctx.stroke();
}

function drawStrawberryInterior(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = radialFill(ctx, r, "#fff6ee", "#ffd8cf", "#f6a99d");
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineWidth = r * 0.025;
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * r * 0.66, Math.sin(angle) * r * 0.72);
    ctx.stroke();
  }

  ctx.fillStyle = "#c78545";
  for (const [sx, sy] of STRAWBERRY_SEEDS) {
    ctx.beginPath();
    ctx.ellipse(sx * r * 0.8, sy * r * 0.8, r * 0.026, r * 0.042, 0.2, 0, TAU);
    ctx.fill();
  }
}

function drawPineappleWhole(ctx: CanvasRenderingContext2D, r: number): void {
  pineapplePath(ctx, r);
  paintBody(ctx, r, "#ffe27b", "#f2a51c", "#b36100");

  ctx.save();
  pineapplePath(ctx, r);
  ctx.clip();
  ctx.strokeStyle = "rgba(140, 75, 0, 0.35)";
  ctx.lineWidth = r * 0.028;
  for (let i = -4; i <= 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.9 + i * r * 0.26, -r);
    ctx.lineTo(r * 0.9 + i * r * 0.26, r);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.9 - i * r * 0.26, -r);
    ctx.lineTo(-r * 0.9 - i * r * 0.26, r);
    ctx.stroke();
  }
  highlight(ctx, -r * 0.3, -r * 0.4, r * 0.18, r * 0.32, 0.15, 0.18);
  ctx.restore();

  ctx.fillStyle = "#2e8b3c";
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.translate(i * r * 0.18, -r * 0.82);
    ctx.rotate(i * 0.24);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-r * 0.14, -r * 0.38, 0, -r * 0.86);
    ctx.quadraticCurveTo(r * 0.14, -r * 0.38, 0, 0);
    ctx.fill();
    ctx.restore();
  }
}

function drawPineappleInterior(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = radialFill(ctx, r, "#fff3b0", "#ffd75a", "#e7a51f");
  ctx.fill();

  ctx.strokeStyle = "rgba(200, 132, 20, 0.38)";
  ctx.lineWidth = r * 0.025;
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * r * 0.7, Math.sin(angle) * r * 0.88);
    ctx.stroke();
  }

  ctx.fillStyle = "#d89a27";
  for (let i = 0; i < 9; i += 1) {
    const angle = i * 2.399;
    const distance = r * (0.18 + ((i * 29) % 100) / 190);
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance * 1.2, r * 0.035, 0, TAU);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.17, 0, TAU);
  ctx.fillStyle = "rgba(255, 244, 190, 0.9)";
  ctx.fill();
}

function drawCoconutWhole(ctx: CanvasRenderingContext2D, r: number): void {
  circlePath(ctx, r);
  paintBody(ctx, r, "#c08050", "#7b4522", "#3b1d0c");

  ctx.save();
  circlePath(ctx, r);
  ctx.clip();
  ctx.strokeStyle = "rgba(45, 21, 8, 0.32)";
  ctx.lineWidth = r * 0.035;
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath();
    ctx.arc(0, -r * 0.7 + i * r * 0.18, r * (0.72 + (i % 3) * 0.07), -1.2, 1.2);
    ctx.stroke();
  }
  highlight(ctx, -r * 0.34, -r * 0.4, r * 0.2, r * 0.12, -0.6, 0.22);
  ctx.restore();

  ctx.fillStyle = "#2b1509";
  const eyes: ReadonlyArray<readonly [number, number, number]> = [
    [-0.24, -0.08, 0.11], [0.24, -0.08, 0.11], [0, 0.3, 0.12],
  ];
  for (const [x, y, radius] of eyes) {
    ctx.beginPath();
    ctx.arc(x * r, y * r, radius * r, 0, TAU);
    ctx.fill();
  }
}

function drawCoconutInterior(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.fillStyle = radialFill(ctx, r, "#fffdf7", "#f5ecd8", "#dcc7a2");
  ctx.fill();

  ctx.strokeStyle = "rgba(100, 60, 30, 0.32)";
  ctx.lineWidth = r * 0.04;
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * (0.2 + i * 0.1), -2.4, -0.7);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, -r * 0.02, r * 0.14, 0, TAU);
  ctx.fillStyle = "#6b3d1d";
  ctx.fill();
}

const DEFINITIONS: Record<FruitKind, FruitDefinition> = {
  watermelon: {
    kind: "watermelon",
    label: "Watermelon",
    emoji: "🍉",
    color: "#ff4b62",
    glow: "rgba(255, 75, 98, 0.8)",
    flesh: "#ff4b62",
    fleshDark: "#c8143c",
    rind: "#2e9c46",
    radiusScale: 1.18,
    points: 8,
    drawBody: circlePath,
    drawWhole: drawWatermelonWhole,
    drawInterior: drawWatermelonInterior,
  },
  orange: {
    kind: "orange",
    label: "Orange",
    emoji: "🍊",
    color: "#ff9a1f",
    glow: "rgba(255, 154, 31, 0.8)",
    flesh: "#ffb24a",
    fleshDark: "#e86a00",
    rind: "#e07a00",
    radiusScale: 0.98,
    points: 10,
    drawBody: circlePath,
    drawWhole: drawOrangeWhole,
    drawInterior: drawOrangeInterior,
  },
  apple: {
    kind: "apple",
    label: "Apple",
    emoji: "🍎",
    color: "#e8263b",
    glow: "rgba(232, 38, 59, 0.8)",
    flesh: "#f5ecc9",
    fleshDark: "#dcc98f",
    rind: "#b30f24",
    radiusScale: 1.02,
    points: 10,
    drawBody: applePath,
    drawWhole: drawAppleWhole,
    drawInterior: drawAppleInterior,
  },
  banana: {
    kind: "banana",
    label: "Banana",
    emoji: "🍌",
    color: "#ffd93b",
    glow: "rgba(255, 217, 59, 0.8)",
    flesh: "#fff4c2",
    fleshDark: "#e8d789",
    rind: "#d4a30c",
    radiusScale: 1.14,
    points: 12,
    drawBody: bananaPath,
    drawWhole: drawBananaWhole,
    drawInterior: drawBananaInterior,
  },
  strawberry: {
    kind: "strawberry",
    label: "Strawberry",
    emoji: "🍓",
    color: "#f2233f",
    glow: "rgba(242, 35, 63, 0.8)",
    flesh: "#ffd8cf",
    fleshDark: "#f6a99d",
    rind: "#c8102e",
    radiusScale: 0.9,
    points: 15,
    drawBody: strawberryPath,
    drawWhole: drawStrawberryWhole,
    drawInterior: drawStrawberryInterior,
  },
  pineapple: {
    kind: "pineapple",
    label: "Pineapple",
    emoji: "🍍",
    color: "#f2a51c",
    glow: "rgba(242, 165, 28, 0.8)",
    flesh: "#ffd75a",
    fleshDark: "#e7a51f",
    rind: "#b36100",
    radiusScale: 1.1,
    points: 15,
    drawBody: pineapplePath,
    drawWhole: drawPineappleWhole,
    drawInterior: drawPineappleInterior,
  },
  coconut: {
    kind: "coconut",
    label: "Coconut",
    emoji: "🥥",
    color: "#a9673c",
    glow: "rgba(169, 103, 60, 0.8)",
    flesh: "#f5ecd8",
    fleshDark: "#dcc7a2",
    rind: "#5a321a",
    radiusScale: 0.98,
    points: 12,
    drawBody: circlePath,
    drawWhole: drawCoconutWhole,
    drawInterior: drawCoconutInterior,
  },
};

export const FRUIT_KINDS: readonly FruitKind[] = [
  "watermelon",
  "orange",
  "apple",
  "banana",
  "strawberry",
  "pineapple",
  "coconut",
];

export const FRUITS = DEFINITIONS;

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  kind: FruitKind,
  radius: number,
): void {
  const definition = FRUITS[kind];
  ctx.save();
  definition.drawWhole(ctx, radius);
  ctx.restore();
}

function clipHalf(ctx: CanvasRenderingContext2D, r: number, side: 0 | 1): void {
  ctx.beginPath();
  if (side === 0) {
    ctx.rect(-r * 1.7, -r * 1.7, r * 3.4, r * 1.7);
  } else {
    ctx.rect(-r * 1.7, 0, r * 3.4, r * 1.7);
  }
  ctx.clip();
}

export function drawFruitHalf(
  ctx: CanvasRenderingContext2D,
  kind: FruitKind,
  radius: number,
  side: 0 | 1,
): void {
  const definition = FRUITS[kind];

  ctx.save();
  clipHalf(ctx, radius, side);

  ctx.save();
  definition.drawBody(ctx, radius);
  ctx.clip();
  definition.drawInterior(ctx, radius);
  ctx.restore();

  ctx.save();
  definition.drawBody(ctx, radius);
  ctx.strokeStyle = definition.rind;
  ctx.lineWidth = radius * 0.11;
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = radius * 0.035;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.2, 0);
  ctx.lineTo(radius * 1.2, 0);
  ctx.stroke();

  ctx.restore();
}

export function drawBomb(
  ctx: CanvasRenderingContext2D,
  radius: number,
  time: number,
): void {
  const pulse = 0.6 + 0.4 * Math.sin(time * 9);

  ctx.save();
  ctx.shadowColor = `rgba(255, 92, 30, ${0.55 + pulse * 0.3})`;
  ctx.shadowBlur = radius * (0.5 + pulse * 0.35);

  circlePath(ctx, radius);
  ctx.fillStyle = radialFill(ctx, radius, "#5b6070", "#1b1d26", "#05050a");
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = radius * 0.05;
  ctx.beginPath();
  ctx.arc(0, radius * 0.05, radius * 0.9, 0.5, 1.9);
  ctx.stroke();

  highlight(ctx, -radius * 0.36, -radius * 0.4, radius * 0.22, radius * 0.12, -0.6, 0.35);

  ctx.strokeStyle = "#3b2a1a";
  ctx.lineWidth = radius * 0.13;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(radius * 0.42, -radius * 0.82);
  ctx.bezierCurveTo(
    radius * 0.6,
    -radius * 1.16,
    radius * 0.26,
    -radius * 1.3,
    radius * 0.5,
    -radius * 1.5,
  );
  ctx.stroke();

  const sparkX = radius * 0.5;
  const sparkY = -radius * 1.5;
  const glow = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, radius * 0.55);
  glow.addColorStop(0, "rgba(255, 255, 220, 1)");
  glow.addColorStop(0.35, "rgba(255, 200, 60, 0.9)");
  glow.addColorStop(1, "rgba(255, 80, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, radius * 0.55, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#fffbe6";
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, radius * (0.07 + 0.03 * pulse), 0, TAU);
  ctx.fill();
}

export const BOMB_COLOR = "#ff6a2b";
export const BOMB_GLOW = "rgba(255, 106, 43, 0.9)";
