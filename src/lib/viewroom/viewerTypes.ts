/**
 * Terra viewer contracts. Framework-free (no Next, no React) so the same core can be hosted by a
 * Vite app later. UI code only ever sees these types — never a specific loader or renderer.
 */

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];

export type MeshFormat = "fbx" | "glb" | "gltf" | "obj";
export type GaussianFormat = "ply" | "spz" | "sog" | "splat" | "ksplat";
export type AssetFormat = MeshFormat | GaussianFormat;
export type AssetKind = "mesh" | "gaussian-splat";

/** Orientation/scale corrections live here (manifest or one format adapter), never in components. */
export interface AssetTransform {
  position?: Vec3;
  quaternion?: Quat;
  uniformScale?: number;
}

/**
 * Where sidecar resources (textures, .bin buffers, .mtl) come from.
 * - `remote`: a trusted descriptor. Known aliases/missing files are explicit; nothing else is rewritten.
 * - `local`: files the visitor picked. Resolution never leaves that set (no author paths, no network).
 */
export type ResourcePolicy =
  | {
      type: "remote";
      /** Base URL (already URL-encoded) that relative resource names resolve against. */
      baseUrl: string;
      /** Lower-case basename → replacement file name inside `baseUrl` (e.g. `atlas.psd` → `Atlas.jpg`). */
      aliases?: Record<string, string>;
      /** Lower-case basenames known to be absent: served a neutral placeholder, no network request. */
      missing?: string[];
    }
  | { type: "local"; files: LocalResource[] }
  | { type: "none" };

export interface LocalResource {
  /** Relative path inside the selection (`textures/wall.png`), or just the file name. */
  path: string;
  /** Object URL owned by the bundle that created it. */
  url: string;
  size: number;
}

interface AssetBase {
  /** Model URL: static path, short-lived signed URL, or `blob:` URL. Never persisted or logged. */
  url: string;
  /** Original file name — required to identify blob URLs, which carry no extension. */
  fileName?: string;
  transform?: AssetTransform;
  resources?: ResourcePolicy;
  sizeBytes?: number;
}

export type Terra3DAsset =
  | (AssetBase & { kind: "mesh"; format: MeshFormat; mesh?: MeshOptions })
  | (AssetBase & { kind: "gaussian-splat"; format: GaussianFormat; gaussian?: GaussianOptions });

export interface MeshOptions {
  /** Alpha-test threshold used when a material takes its cut-out from the colour map's alpha. */
  alphaTest?: number;
  /** Play the first embedded animation clip when the viewer is allowed to animate. */
  animation?: boolean;
  /**
   * FBX semantics: a texture connected to a colour slot replaces that colour, whereas three.js
   * multiplies them. Defaults to true for FBX; set false for files authored the other way.
   */
  textureReplacesColor?: boolean;
  /** Per-material corrections keyed by the material name in the source file. */
  materialOverrides?: Record<string, MaterialOverride>;
}

/**
 * `shadow-decal`: geometry that carries baked contact shadows (white = no effect). Rendered unlit
 * with multiply blending on top of the surfaces below, never casting or receiving shadows.
 */
export interface MaterialOverride {
  role: "shadow-decal";
}

export interface GaussianOptions {
  /** Build Spark's LoD tree at load (large scenes). Costs decode time; off by default. */
  lod?: boolean;
}

/** Honest provenance: a prototype mesh must never be presented as a reconstructed tree snapshot. */
export type AssetOrigin = "prototype" | "reconstruction" | "dev-fixture" | "local-file";

export interface CameraPreset {
  position: Vec3;
  target: Vec3;
  fov?: number;
}

export interface TourKeyframe extends CameraPreset {
  /** Seconds spent travelling from the previous keyframe to this one (ignored for the first). */
  duration: number;
}

export interface TerraModelManifest {
  modelId: string;
  label: string;
  origin: AssetOrigin;
  treeId?: string;
  snapshotId?: string;

  kind: AssetKind;
  format: AssetFormat;
  url: string;
  fileName?: string;

  artifactHash?: string;
  sizeBytes?: number;

  captureTime?: string;
  reconstructedAt?: string;
  approvedAt?: string;
  coverage?: string;
  sourceImageCount?: number;
  snapshotVersion?: string;

  coordinateSystem?: string;
  upAxis?: "x" | "y" | "z";
  bbox?: { min: Vec3; max: Vec3 };
  defaultCamera?: CameraPreset;
  tour?: TourKeyframe[];
  transform?: AssetTransform;
  resources?: ResourcePolicy;
  mesh?: MeshOptions;
  gaussian?: GaussianOptions;

  posterUrl?: string;
  attribution?: string;
  /** Visible notes about the asset itself (known degradations, derivations). */
  notes?: string[];
  quality?: { status?: string; notes?: string[] };
}

export type CameraMode = "explore" | "fly" | "cinematic";
export type ViewerQuality = "auto" | "mobile" | "balanced" | "high";

export type ViewerStatus =
  | "idle"
  | "loading-viewer"
  | "loading-asset"
  | "ready"
  | "error"
  | "unsupported"
  | "context-lost";

export type LoadPhase = "fetching" | "decoding" | "preparing";

export interface LoadProgress {
  phase: LoadPhase;
  loaded?: number;
  /** Only set when the byte total is trustworthy; otherwise progress is indeterminate. */
  total?: number;
  /** Sidecar resources (textures, buffers) finished / requested so far. */
  items?: { done: number; total: number };
}

export type ViewerErrorCode =
  | "unsupported-format"
  | "not-gaussian-ply"
  | "fetch-failed"
  | "decode-failed"
  | "missing-resources"
  | "ambiguous-selection"
  | "empty-file"
  | "too-large"
  | "webgl-unavailable"
  | "context-lost";

export class ViewerError extends Error {
  readonly code: ViewerErrorCode;
  readonly details: string[];
  constructor(code: ViewerErrorCode, message: string, details: string[] = []) {
    super(message);
    this.name = "ViewerError";
    this.code = code;
    this.details = details;
  }
}

export interface AssetWarning {
  code: "missing-texture" | "ambiguous-resource" | "neutral-material" | "alpha-from-map" | "large-asset";
  message: string;
}

export interface AssetStats {
  meshes?: number;
  triangles?: number;
  materials?: number;
  textures?: number;
  splats?: number;
  animations?: number;
}

export interface Bounds {
  min: Vec3;
  max: Vec3;
}
