"use client";

import { NeonButton } from "./NeonButton";

interface PauseScreenProps {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export function PauseScreen({ onResume, onRestart, onMenu }: PauseScreenProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#05030f]/70 p-5 backdrop-blur-md">
      <div className="animate-pop-in relative w-full max-w-sm overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#0a0718]/95 p-6 text-center shadow-[0_0_70px_rgba(34,211,238,0.16)] sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl"
        />
        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-2xl shadow-[0_0_24px_rgba(34,211,238,0.2)]">
            <span aria-hidden>❚❚</span>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.36em] text-cyan-200/70">
            Blade on standby
          </p>
          <h2 className="mt-1 font-display text-4xl tracking-[0.12em] text-white">
            PAUSED
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Take a breath. The fruit will wait... for now.
          </p>

          <div className="mt-7 flex flex-col gap-3">
            <NeonButton onClick={onResume} className="w-full sm:w-full">
              <span aria-hidden>▶</span> Resume
            </NeonButton>
            <NeonButton
              variant="secondary"
              onClick={onRestart}
              className="w-full sm:w-full"
            >
              <span aria-hidden>↻</span> Restart
            </NeonButton>
            <NeonButton
              variant="ghost"
              onClick={onMenu}
              className="w-full border-white/10 sm:w-full"
            >
              <span aria-hidden>⌂</span> Main Menu
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}
