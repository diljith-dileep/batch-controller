const HIGH_SCORE_KEY = "fruit-slash:high-score";
const MUTED_KEY = "fruit-slash:muted";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadHighScore(): number {
  if (!canUseStorage()) return 0;
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
    const value = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(Math.max(0, Math.floor(score))));
  } catch {
    // Storage can be unavailable (private mode, quota); the game still works.
  }
}

export function loadMutedPreference(): boolean {
  if (!canUseStorage()) return false;
  try {
    return window.localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMutedPreference(muted: boolean): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
  } catch {
    // Ignore storage failures.
  }
}
