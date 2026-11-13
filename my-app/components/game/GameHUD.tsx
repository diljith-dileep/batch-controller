"use client";

interface GameHUDProps {
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  muted: boolean;
  onPause: () => void;
  onToggleSound: () => void;
}

export function GameHUD({
  score,
  highScore,
  lives,
  maxLives,
  muted,
  onPause,
  onToggleSound,
}: GameHUDProps) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-5">
        <div className="rounded-2xl border border-cyan-300/15 bg-[#07030f]/55 px-4 py-2.5 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur-md">
          <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-cyan-200/70">
            Score
          </p>
          <p className="font-display text-3xl leading-none tracking-wide text-white tabular-nums drop-shadow-[0_0_14px_rgba(34,211,238,0.8)] sm:text-4xl">
            {score.toLocaleString()}
          </p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-200/70">
            Best {highScore.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[#07030f]/55 px-3 py-2 backdrop-blur-md">
            {Array.from({ length: maxLives }).map((_, index) => {
              const filled = index < lives;
              return (
                <span
                  key={index}
                  aria-hidden
                  className={`text-lg leading-none transition-all duration-300 sm:text-xl ${
                    filled
                      ? "scale-100 opacity-100 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                      : "scale-90 opacity-25 grayscale"
                  }`}
                >
                  ❤️
                </span>
              );
            })}
            <span className="sr-only">{lives} lives remaining</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSound}
              aria-pressed={!muted}
              aria-label={muted ? "Turn sound on" : "Turn sound off"}
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#07030f]/65 text-lg text-cyan-100 backdrop-blur-md transition hover:border-cyan-300/50 hover:bg-cyan-300/10 active:scale-95"
            >
              <span aria-hidden>{muted ? "🔇" : "🔊"}</span>
            </button>
            <button
              type="button"
              onClick={onPause}
              aria-label="Pause game"
              className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/25 bg-[#07030f]/65 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.15)] backdrop-blur-md transition hover:border-cyan-300/60 hover:bg-cyan-300/10 active:scale-95"
            >
              <span aria-hidden className="text-sm font-black tracking-[-0.18em]">
                ❚❚
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-4 sm:bottom-5">
        <p className="rounded-full border border-white/[0.06] bg-black/25 px-4 py-1.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/35 backdrop-blur-sm sm:text-[10px]">
          Drag to slice <span className="mx-1 text-rose-300/60">•</span> Avoid the bombs
        </p>
      </div>
    </>
  );
}
