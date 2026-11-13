"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { NeonButton } from "./NeonButton";

interface HomeScreenProps {
  highScore: number;
  muted: boolean;
  onStart: () => void;
  onToggleSound: () => void;
}

interface FloatingFruit {
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  duration: number;
  delay: number;
  opacity: number;
}

const FLOATING_FRUITS: FloatingFruit[] = [
  { emoji: "🍉", x: 6, y: 16, size: 76, rotation: -16, duration: 10, delay: -2, opacity: 0.85 },
  { emoji: "🍊", x: 86, y: 12, size: 62, rotation: 12, duration: 8, delay: -4, opacity: 0.8 },
  { emoji: "🍓", x: 12, y: 74, size: 54, rotation: 20, duration: 9, delay: -1, opacity: 0.75 },
  { emoji: "🍍", x: 82, y: 68, size: 68, rotation: -10, duration: 11, delay: -5, opacity: 0.8 },
  { emoji: "🍌", x: 74, y: 88, size: 62, rotation: 18, duration: 9.5, delay: -3, opacity: 0.7 },
  { emoji: "🍎", x: 4, y: 46, size: 44, rotation: -22, duration: 8.5, delay: -6, opacity: 0.55 },
  { emoji: "🥥", x: 92, y: 44, size: 48, rotation: 10, duration: 12, delay: -2.5, opacity: 0.6 },
];

function fruitStyle(fruit: FloatingFruit): CSSProperties {
  return {
    left: `${fruit.x}%`,
    top: `${fruit.y}%`,
    fontSize: `${fruit.size}px`,
    opacity: fruit.opacity,
    "--rot": `${fruit.rotation}deg`,
    "--dur": `${fruit.duration}s`,
    "--delay": `${fruit.delay}s`,
  } as CSSProperties;
}

const STEPS: Array<{ icon: string; title: string; description: string }> = [
  {
    icon: "🖱️",
    title: "Swipe",
    description: "Click and drag on desktop, or swipe with your finger on touch screens.",
  },
  {
    icon: "🍉",
    title: "Slice",
    description: "Cut fruit in half to score. Chain slices quickly for combo bonuses.",
  },
  {
    icon: "💣",
    title: "Dodge",
    description: "Never slice a bomb — one wrong swipe ends the whole run.",
  },
  {
    icon: "❤️",
    title: "Survive",
    description: "You have 3 lives. Every fruit that falls off the screen costs one.",
  },
];

export function HomeScreen({
  highScore,
  muted,
  onStart,
  onToggleSound,
}: HomeScreenProps) {
  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    if (!showHowTo) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowHowTo(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showHowTo]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-5 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(124,58,237,0.28),transparent_48%),radial-gradient(circle_at_82%_82%,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_50%_110%,rgba(236,72,153,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,3,15,0.2),rgba(5,3,15,0.9))]" />
        <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/10" />
        <div className="absolute left-1/2 top-1/2 h-[92vmin] w-[92vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-400/10" />
        <div className="slash-streak absolute left-[8%] top-[58%] h-[3px] w-[84%] rotate-[-14deg] rounded-full" />
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLOATING_FRUITS.map((fruit) => (
          <span
            key={fruit.emoji + fruit.x}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={fruitStyle(fruit)}
          >
            <span className="fruit-float inline-block drop-shadow-[0_0_25px_rgba(34,211,238,0.22)]">
              {fruit.emoji}
            </span>
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleSound}
        aria-pressed={!muted}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-100 backdrop-blur-md transition hover:border-cyan-300/50 hover:bg-cyan-300/10 sm:right-6 sm:top-6"
      >
        <span className="text-base leading-none">{muted ? "🔇" : "🔊"}</span>
        <span className="hidden sm:inline">{muted ? "Sound off" : "Sound on"}</span>
      </button>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-5 flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-200/90 backdrop-blur-sm sm:text-[11px]">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,1)]" />
          Neon slicing arcade
        </div>

        <h1 className="title-neon font-display text-[clamp(3.4rem,16vw,8.5rem)] leading-[0.8] tracking-[-0.03em]">
          <span className="block">FRUIT</span>
          <span className="block">SLASH</span>
        </h1>

        <div className="mt-5 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-white/45 sm:text-xs">
          <span>Slice</span>
          <span className="h-1 w-1 rounded-full bg-fuchsia-400/70" />
          <span>Combo</span>
          <span className="h-1 w-1 rounded-full bg-cyan-300/70" />
          <span>Survive</span>
        </div>

        <div className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:mt-10">
          <NeonButton onClick={onStart} className="text-base sm:text-base">
            <span aria-hidden>⚔️</span> Play Game
          </NeonButton>
          <NeonButton variant="secondary" onClick={() => setShowHowTo(true)}>
            <span aria-hidden>❔</span> How to Play
          </NeonButton>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-sm">
            <span aria-hidden className="text-sm">🏆</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/50">
              Best
            </span>
            <span className="font-display text-sm text-amber-200">
              {highScore.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 backdrop-blur-sm">
            <span aria-hidden>🖱️</span> Drag to slice
            <span aria-hidden className="sm:hidden">👆</span>
          </div>
        </div>

        <p className="mt-6 max-w-sm text-xs leading-relaxed text-white/35">
          A neon-powered fruit frenzy. Cut everything that moves — except the bombs.
        </p>
      </div>

      {showHowTo ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-to-title"
          className="absolute inset-0 z-40 flex items-center justify-center bg-[#05030f]/85 p-4 backdrop-blur-md"
        >
          <div className="animate-pop-in relative w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#0a0718]/95 p-6 shadow-[0_0_80px_rgba(34,211,238,0.15)] sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl"
            />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-300/80">
                    Field manual
                  </p>
                  <h2 id="how-to-title" className="mt-2 font-display text-3xl tracking-wide text-white">
                    HOW TO PLAY
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHowTo(false)}
                  aria-label="Close instructions"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-lg text-white/60 transition hover:border-rose-300/50 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {STEPS.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span aria-hidden className="text-lg">{step.icon}</span>
                      <span className="font-display text-sm tracking-[0.16em] text-cyan-100">
                        {step.title.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/50">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-xs leading-relaxed text-amber-100/60">
                <span className="font-bold text-amber-200">Combo tip:</span> slice
                2 or more fruits within about half a second to earn bonus points.
                The frenzy ramps up the longer you survive.
              </div>

              <div className="mt-6">
                <NeonButton onClick={() => setShowHowTo(false)} className="w-full sm:w-full">
                  Got it — let&apos;s slice
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
