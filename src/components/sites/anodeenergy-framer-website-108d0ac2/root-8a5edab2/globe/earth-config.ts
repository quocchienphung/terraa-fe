/**
 * Globe parameters. Everything here is a proposed design value tuned against the Anode
 * poster (public/images/reference/globe-night.webp) and the user screenshot; none of it was
 * measured on Stripe or Anode (the Anode reference is a still image, not WebGL).
 */

export type QualityTier = "desktop" | "mobile";

export const EARTH_TEXTURES: Record<QualityTier, { day: string; night: string; masks: string; normal: string }> = {
  desktop: {
    day: "/textures/earth/earth-day-4k.webp",
    night: "/textures/earth/earth-night-4k.webp",
    masks: "/textures/earth/earth-masks-2k.webp",
    normal: "/textures/earth/earth-normal-2k.webp",
  },
  mobile: {
    day: "/textures/earth/earth-day-2k.webp",
    night: "/textures/earth/earth-night-2k.webp",
    masks: "/textures/earth/earth-masks-2k.webp",
    normal: "/textures/earth/earth-normal-2k.webp",
  },
};

export const QUALITY: Record<QualityTier, { maxDpr: number; widthSegments: number; heightSegments: number }> = {
  desktop: { maxDpr: 1.5, widthSegments: 96, heightSegments: 64 },
  mobile: { maxDpr: 1.25, widthSegments: 64, heightSegments: 48 },
};

/**
 * Composition per container width (first match wins, ordered wide → narrow).
 * - diameter: projected globe diameter as a fraction of the container width
 * - maxRadiusOfHeight: radius cap relative to the container height, so very wide screens keep
 *   the poster's latitude band (2560×1009 reference screenshot: radius ≈ 1.04 × height)
 * - top:      top of the globe silhouette as a fraction of the container height
 * - focusX/Y: where a selected location is brought to (fractions of the container); kept on
 *   the day side of the terminator so the selected region is readable
 */
export const FRAMING = [
  { minWidth: 1200, diameter: 0.9, maxRadiusOfHeight: 1.05, top: 0.25, focusX: 0.54, focusY: 0.6 },
  { minWidth: 768, diameter: 1.15, maxRadiusOfHeight: 1.2, top: 0.3, focusX: 0.5, focusY: 0.62 },
  { minWidth: 0, diameter: 1.9, maxRadiusOfHeight: 1.4, top: 0.36, focusX: 0.5, focusY: 0.55 },
] as const;

export const CAMERA_FOV_DEG = 24;

export const ORIENTATION = {
  /** Initial longitude on the view axis — Central/South Asia, like the poster. */
  initialLon: 70,
  /** Latitude that sits on the view axis by default (tilts the north towards the viewer). */
  axisLat: 8,
  /** Seconds per revolution while idle (unchanged baseline; proposed 120–180s range). */
  periodSeconds: 150,
  /** Delay before auto-rotation resumes after pointer/focus leaves the UI. */
  resumeDelayMs: 1500,
  /** Focus tween duration and the time constant for easing tilt back to the default. */
  focusMs: 1000,
  tiltReturnTau: 1.6,
} as const;

/**
 * Pointer steering, drag and release inertia (proposed values, tuned in the browser).
 * Angular velocities are rad/s; positive moves the visible surface to the viewer's right.
 */
export const INTERACTION = {
  steering: { deadZone: 0.12, leftGain: 7, rightGain: 5 },
  /** Exponential time constants (s): towards a steering target, back to idle, UI hold, Pause, after a fling. */
  tauSteer: 0.24,
  tauIdle: 0.45,
  tauHold: 0.08,
  tauPause: 0.12,
  tauInertia: 0.25,
  /** Release inertia window (s) during which tauInertia applies. */
  inertiaSeconds: 0.7,
  /** Pointer travel (CSS px) before a press becomes a drag. */
  dragThresholdPx: 5,
  /** Yaw per CSS px = gain / projected globe radius: 1 keeps the grabbed point under the cursor near the centre. */
  dragGain: 1,
  /** Smoothing of the drag velocity estimate (s), the age after which a release counts as "stopped" (ms), and the fling cap (rad/s). */
  velocityTau: 0.05,
  releaseStaleMs: 90,
  maxFlingOmega: 3,
} as const;

/**
 * Cloud shell drift relative to the surface. Its own clock: keeps running while the surface is
 * held or reversed, stops only for Pause, reduced motion, hidden tab or offscreen. Time-compressed
 * artistic motion, not a wind model.
 */
export const CLOUDS = {
  relativePeriodSeconds: 800,
} as const;

/** Sun direction in view space: upper right, slightly towards the camera. Night falls on the left. */
export const SUN_DIRECTION: [number, number, number] = [0.9, 0.24, 0.1];

export const LOOK = {
  saturation: 0.78,
  sunIntensity: 0.88,
  ambient: 0.018,
  exposure: 1.0,
  normalScale: 0.9,
  specular: 0.03,
  nightIntensity: 1.15,
  atmosphereColor: [0.3, 0.72, 0.95] as [number, number, number],
  /** Inner Fresnel haze on the surface and outer rim shell thickness (fraction of radius). */
  hazeStrength: 0.18,
  rimScale: 1.012,
  rimStrength: 0.38,
  cloudRadius: 1.004,
  cloudOpacity: 0.66,
} as const;

/** Scroll entry: scale and vertical offset (px) eased in as the section enters. */
export const ENTRY = {
  fromScale: 0.98,
  fromOffsetPx: 40,
} as const;

/** Near-viewport distance at which the WebGL scene starts loading. */
export const LOAD_ROOT_MARGIN = "700px 0px";
/** Canvas crossfade over the poster once the first frame has rendered. */
export const CROSSFADE_MS = 350;

export function pickFraming(width: number) {
  return FRAMING.find((f) => width >= f.minWidth) ?? FRAMING[FRAMING.length - 1];
}

export function pickTier(): QualityTier {
  const narrow = Math.min(window.innerWidth, window.screen.width) < 768;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return narrow || coarse ? "mobile" : "desktop";
}
