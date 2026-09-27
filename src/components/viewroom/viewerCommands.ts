import type { CameraMode, Vec3 } from "@/lib/viewroom/viewerTypes";

export interface CameraPose {
  mode: CameraMode;
  position: Vec3;
  target: Vec3;
}

/** Imperative bridge from DOM controls to the in-canvas camera owner. */
export interface ViewerCommands {
  /** Current pose — also used to author manifest camera presets. */
  getPose: () => CameraPose;
  /** Jump to a pose in Orbit mode (authoring/testing). */
  setPose: (position: Vec3, target: Vec3) => void;
  setMode: (mode: CameraMode) => void;
  resetView: () => void;
  tourPlay: () => void;
  tourPause: () => void;
  tourRestart: () => void;
  tourExit: () => void;
}

export interface TourState {
  available: boolean;
  playing: boolean;
  /** 0..1 */
  progress: number;
  ended: boolean;
}

export const IDLE_TOUR: TourState = { available: false, playing: false, progress: 0, ended: false };
