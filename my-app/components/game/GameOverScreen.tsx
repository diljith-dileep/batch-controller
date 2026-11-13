"use client";

import type { GameOverReason } from "@/lib/game/types";
import { NeonButton } from "./NeonButton";

interface GameOverScreenProps {
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  reason: GameOverReason;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOverScreen({
  score,
  bestScore,
  isNewRecord,
  reason,
  onRestart,
  onMenu,
}: GameOverScreenProps) {
  const bombed = reason === "bomb";

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden bg-[#05030f]/80 p-5 backdrop-blur-md">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2">
          <span className="gameover-ring" />
          <span className="gameover-ring gameover-ring-delayed" />
          <span className="gameover-ring gameover-ring-late" />
        </div>
        <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.16),transparent_65%)] blur-2xl" />
      </div>

      <div className="animate-pop-in relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-300/20 bg-[#0a0718]/95 shadow-[0_0_80px_rgba(244,63,94,0.18)]">
        <div
          aria-hidden
          className={`h-1.5 w-full bg-gradient-to-r ${
            bombed
              ? "from-orange-400 via-rose-500 to-red-600"
              : "from-cyan-300 via-fuchsia-500 to-rose-500"
          }`}
        />

        <div className="relative p-6 text-center sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-3xl shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <span aria-hidden>{bombed ? "💥" : "💔"}</span>
          </div>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.34em] text-rose-200/70">
            {bombed ? "Bomb detonated" : "Out of lives"}
          </p>
          <h2 className="title-neon mt-1 font-display text-4xl tracking-[0.08em] sm:text-5xl">
            GAME OVER
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            {bombed
              ? "That was not a fruit. The neon dojo demands a rematch."
              : "The fruit slipped past your blade one too many times."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] px-4 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-cyan-200/60">
                Final score
              </p>
              <p className="mt-1 font-display text-3xl text-white tabular-nums drop-shadow-[0_0_16px_rgba(34,211,238,0.65)]">
                {score.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-amber-200/60">
                Best score
              </p>
              <p className="mt-1 font-display text-3xl text-amber-100 tabular-nums">
                {bestScore.toLocaleString()}
              </p>
            </div>
          </div>

          {isNewRecord ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-amber-200 shadow-[0_0_24px_rgba(252,211,77,0.2)]">
              <span aria-hidden>🏆</span> New high score
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3">
            <NeonButton onClick={onRestart} className="w-full sm:w-full">
              <span aria-hidden>↻</span> Play Again
            </NeonButton>
            <NeonButton
              variant="secondary"
              onClick={onMenu}
              className="w-full sm:w-full"
            >
              <span aria-hidden>⌂</span> Main Menu
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}
