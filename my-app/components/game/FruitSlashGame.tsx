"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { soundManager } from "@/lib/game/SoundManager";
import { loadHighScore, saveHighScore } from "@/lib/game/storage";
import type {
  GameOverResult,
  GameStats,
} from "@/lib/game/types";
import { GameCanvas, type GameCanvasHandle } from "./GameCanvas";
import { GameHUD } from "./GameHUD";
import { GameOverScreen } from "./GameOverScreen";
import { HomeScreen } from "./HomeScreen";
import { PauseScreen } from "./PauseScreen";

type Screen = "home" | "playing" | "paused" | "over";

const MAX_LIVES = 3;

export default function FruitSlashGame() {
  const [screen, setScreen] = useState<Screen>("home");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [result, setResult] = useState<GameOverResult | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const canvasRef = useRef<GameCanvasHandle>(null);
  const highScoreRef = useRef(0);

  useEffect(() => {
    const stored = loadHighScore();
    highScoreRef.current = stored;
    soundManager.loadPrefs();
    const savedMuted = soundManager.isMuted();

    const timeout = window.setTimeout(() => {
      setHighScore(stored);
      setMuted(savedMuted);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handleStats = useCallback((stats: GameStats) => {
    setScore(stats.score);
    setLives(stats.lives);
  }, []);

  const handleGameOver = useCallback((gameResult: GameOverResult) => {
    soundManager.stopMusic();

    const previousBest = highScoreRef.current;
    const newRecord = gameResult.score > previousBest;
    if (newRecord) {
      highScoreRef.current = gameResult.score;
      saveHighScore(gameResult.score);
      setHighScore(gameResult.score);
    }

    setIsNewRecord(newRecord);
    setResult(gameResult);
    setScreen("over");
  }, []);

  const handleToggleSound = useCallback(() => {
    const wasMuted = soundManager.isMuted();
    const nowMuted = soundManager.toggle();
    setMuted(nowMuted);
    if (wasMuted && !nowMuted) {
      soundManager.click();
    }
  }, []);

  const handleStart = useCallback(() => {
    soundManager.click();
    soundManager.startMusic();
    setScore(0);
    setLives(MAX_LIVES);
    setResult(null);
    setIsNewRecord(false);
    setGameKey((key) => key + 1);
    setScreen("playing");
  }, []);

  const handlePause = useCallback(() => {
    canvasRef.current?.pause();
    soundManager.click();
    setScreen("paused");
  }, []);

  const handleResume = useCallback(() => {
    canvasRef.current?.resume();
    soundManager.click();
    setScreen("playing");
  }, []);

  const handleRestart = useCallback(() => {
    soundManager.click();
    soundManager.startMusic();
    setScore(0);
    setLives(MAX_LIVES);
    setResult(null);
    setIsNewRecord(false);
    setGameKey((key) => key + 1);
    setScreen("playing");
  }, []);

  const handleMenu = useCallback(() => {
    soundManager.click();
    soundManager.stopMusic();
    setResult(null);
    setIsNewRecord(false);
    setScreen("home");
  }, []);

  useEffect(() => {
    if (screen !== "playing") return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        canvasRef.current?.pause();
        setScreen("paused");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [screen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (screen === "playing") {
        handlePause();
      } else if (screen === "paused") {
        handleResume();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, handlePause, handleResume]);

  const showGame = screen !== "home";

  return (
    <main className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#05030f] text-white">
      {showGame ? (
        <>
          <GameCanvas
            key={gameKey}
            ref={canvasRef}
            onStats={handleStats}
            onGameOver={handleGameOver}
          />
          <GameHUD
            score={score}
            highScore={highScore}
            lives={lives}
            maxLives={MAX_LIVES}
            muted={muted}
            onPause={handlePause}
            onToggleSound={handleToggleSound}
          />

          {screen === "paused" ? (
            <PauseScreen
              onResume={handleResume}
              onRestart={handleRestart}
              onMenu={handleMenu}
            />
          ) : null}

          {screen === "over" && result ? (
            <GameOverScreen
              score={result.score}
              bestScore={highScore}
              isNewRecord={isNewRecord}
              reason={result.reason}
              onRestart={handleRestart}
              onMenu={handleMenu}
            />
          ) : null}
        </>
      ) : (
        <HomeScreen
          highScore={highScore}
          muted={muted}
          onStart={handleStart}
          onToggleSound={handleToggleSound}
        />
      )}
    </main>
  );
}
