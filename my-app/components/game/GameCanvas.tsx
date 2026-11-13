"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { GameEngine } from "@/lib/game/GameEngine";
import type { EngineCallbacks } from "@/lib/game/types";

export interface GameCanvasHandle {
  pause: () => void;
  resume: () => void;
}

interface GameCanvasProps {
  onStats: EngineCallbacks["onStats"];
  onGameOver: EngineCallbacks["onGameOver"];
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  function GameCanvas({ onStats, onGameOver }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const callbacksRef = useRef({ onStats, onGameOver });

    useEffect(() => {
      callbacksRef.current = { onStats, onGameOver };
    }, [onStats, onGameOver]);

    useImperativeHandle(
      ref,
      () => ({
        pause: () => engineRef.current?.pause(),
        resume: () => engineRef.current?.resume(),
      }),
      [],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let engine: GameEngine | null = null;
      try {
        engine = new GameEngine(canvas, {
          onStats: (stats) => callbacksRef.current.onStats(stats),
          onGameOver: (result) => callbacksRef.current.onGameOver(result),
        });
        engineRef.current = engine;
        engine.start();
      } catch (error) {
        console.error("Unable to start Fruit Slash:", error);
      }

      return () => {
        engine?.destroy();
        engineRef.current = null;
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        aria-label="Fruit Slash play area"
        className="absolute inset-0 block h-full w-full touch-none select-none"
      />
    );
  },
);
