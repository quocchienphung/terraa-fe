"use client";

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { dprFor, resolveQuality } from "@/lib/viewroom/quality";
import { isManifest, manifestToAsset } from "@/lib/viewroom/viewerManifest";
import {
  ViewerError,
  type AssetStats,
  type AssetWarning,
  type CameraMode,
  type CameraPreset,
  type LoadProgress,
  type Terra3DAsset,
  type TerraModelManifest,
  type TourKeyframe,
  type ViewerQuality,
  type ViewerStatus,
} from "@/lib/viewroom/viewerTypes";
import type { LoadedAsset } from "./AssetRenderer";
import { useDeviceRatio, useFullscreen, useMediaQuery, useWebGL2Support } from "./viewerHooks";
import { FlyHint, TourBar, ViewerMeta, ViewerToolbar } from "./ViewerHud";
import { HelpPanel, InfoPanel, type ViewerMetaInfo } from "./ViewerPanels";
import { ViewerLoading } from "./ViewerLoading";
import { ViewerErrorBoundary, ViewerFallback } from "./ViewerFallback";
import { ViewerScene, type DebugSample } from "./ViewerScene";
import { IDLE_TOUR, type TourState, type ViewerCommands } from "./viewerCommands";

export interface ViewerReadyInfo {
  kind: Terra3DAsset["kind"];
  format: Terra3DAsset["format"];
  stats: AssetStats;
  warnings: AssetWarning[];
  loadMs: number;
}

export interface TerraViewportProps {
  /** A manifest (preferred) or a bare render contract. The viewport dispatches internally. */
  asset: TerraModelManifest | Terra3DAsset;
  /** HUD metadata when `asset` is a bare Terra3DAsset. */
  meta?: ViewerMetaInfo & { posterUrl?: string; defaultCamera?: CameraPreset; tour?: TourKeyframe[] };
  /** Camera mode to start in once the asset is ready. */
  mode?: CameraMode;
  quality?: ViewerQuality;
  /** `false`: show the poster and a "View in 3D" button; nothing heavy loads until pressed. */
  autoStart?: boolean;
  /** Another UI layer (site menu, modal) owns input. */
  inputBlocked?: boolean;
  /** Development overlay: renderer, draw calls, load time. Never enable for production visitors. */
  debug?: boolean;
  /** Extra buttons for the model group of the toolbar (e.g. Open model). */
  actions?: ReactNode;
  /** Files dropped on the viewport. */
  onDropFiles?: (e: DragEvent<HTMLDivElement>) => void;
  /** Offered in error states (e.g. "Back to Tokyo"). */
  fallbackAction?: { label: string; onClick: () => void };
  onReady?: (info: ViewerReadyInfo) => void;
  onError?: (error: ViewerError) => void;
  onStatusChange?: (status: ViewerStatus) => void;
  className?: string;
}

const MAX_CONTEXT_RECOVERIES = 3;
const ORIGIN_TAG = { prototype: "Prototype", reconstruction: "Reconstruction", "dev-fixture": "Dev fixture", "local-file": "Local file" } as const;

function normalize(input: TerraModelManifest | Terra3DAsset, meta: TerraViewportProps["meta"]) {
  if (isManifest(input)) {
    return {
      asset: manifestToAsset(input),
      meta: {
        label: input.label,
        origin: input.origin,
        attribution: input.attribution,
        notes: input.notes,
        captureTime: input.captureTime,
        reconstructedAt: input.reconstructedAt,
        approvedAt: input.approvedAt,
        coverage: input.coverage,
        sourceImageCount: input.sourceImageCount,
        snapshotVersion: input.snapshotVersion,
        qualityStatus: input.quality?.status,
        posterUrl: input.posterUrl,
        defaultCamera: input.defaultCamera,
        tour: input.tour,
      },
    };
  }
  return { asset: input, meta: meta ?? { label: input.fileName ?? "3D model" } };
}

/**
 * Terra's single 3D viewport: one R3F canvas / WebGLRenderer / scene / camera for every asset
 * kind. Page code passes a manifest; loaders, Spark and camera logic stay inside the viewer.
 */
export function TerraViewport({
  asset: input,
  meta: metaProp,
  mode: initialMode = "explore",
  quality: qualityPref = "auto",
  autoStart = true,
  inputBlocked = false,
  debug = false,
  actions,
  onDropFiles,
  fallbackAction,
  onReady,
  onError,
  onStatusChange,
  className,
}: TerraViewportProps) {
  const normalized = useMemo(() => {
    try {
      return { ...normalize(input, metaProp), error: null };
    } catch (err) {
      return { asset: null, meta: { label: "3D model" } as ReturnType<typeof normalize>["meta"], error: err as ViewerError };
    }
  }, [input, metaProp]);
  const { asset, meta } = normalized;

  const container = useRef<HTMLDivElement>(null);
  const commands = useRef<ViewerCommands | null>(null);

  const webgl2 = useWebGL2Support();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", true);
  const finePointer = useMediaQuery("(any-pointer: fine) and (any-hover: hover)", false);
  const coarsePrimary = useMediaQuery("(pointer: coarse)", false);
  const quality = useMemo(() => resolveQuality(qualityPref, { coarsePointer: coarsePrimary }), [qualityPref, coarsePrimary]);
  const fullscreen = useFullscreen(container);
  const deviceRatio = useDeviceRatio();

  const [started, setStarted] = useState(autoStart);
  const [status, setStatus] = useState<ViewerStatus>(autoStart ? "loading-viewer" : "idle");
  const [progress, setProgress] = useState<LoadProgress | null>(null);
  const [error, setError] = useState<ViewerError | null>(normalized.error);
  const [loaded, setLoaded] = useState<LoadedAsset | null>(null);
  const [mode, setMode] = useState<CameraMode>("explore");
  const [tour, setTour] = useState<TourState>(IDLE_TOUR);
  const [flyLocked, setFlyLocked] = useState(false);
  const [panel, setPanel] = useState<"info" | "help" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [canvasKey, setCanvasKey] = useState(0);
  const [recoveries, setRecoveries] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [debugSample, setDebugSample] = useState<DebugSample | null>(null);

  const callbacks = useRef({ onReady, onError, onStatusChange, initialMode, format: asset?.format });
  useEffect(() => {
    callbacks.current = { onReady, onError, onStatusChange, initialMode, format: asset?.format };
  });
  useEffect(() => {
    callbacks.current.onStatusChange?.(status);
  }, [status]);

  // A new asset resets per-asset UI state.
  const [prevAsset, setPrevAsset] = useState(asset);
  if (prevAsset !== asset) {
    setPrevAsset(asset);
    setLoaded(null);
    setError(normalized.error);
    setAnimate(false);
    setTour(IDLE_TOUR);
    if (started) setStatus(normalized.error ? "error" : "loading-asset");
  }

  const effectiveStatus: ViewerStatus = webgl2 === false ? "unsupported" : status;
  const flyAvailable = finePointer;

  const onStart = useCallback(() => {
    setError(null);
    setProgress(null);
    setLoaded(null);
    setStatus("loading-asset");
  }, []);
  const onProgress = useCallback((p: LoadProgress) => setProgress(p), []);
  const onLoaded = useCallback((l: LoadedAsset) => {
    setLoaded(l);
    setStatus("ready");
    const { onReady: ready, format } = callbacks.current;
    if (ready && format) ready({ kind: l.handle.kind, format, stats: l.handle.stats, warnings: l.handle.warnings, loadMs: l.loadMs });
  }, []);
  const onAssetError = useCallback((err: ViewerError) => {
    setError(err);
    setStatus("error");
    callbacks.current.onError?.(err);
  }, []);
  const onContextLost = useCallback(() => setStatus("context-lost"), []);

  // Start in the requested mode once ready (e.g. an embed that opens straight into the tour).
  useEffect(() => {
    if (status !== "ready") return;
    const m = callbacks.current.initialMode;
    if (m !== "explore") commands.current?.setMode(m);
  }, [status]);

  // Development-only automation hook (never enabled for production visitors).
  const debugState = useRef({ status, sample: debugSample });
  useEffect(() => {
    debugState.current = { status: effectiveStatus, sample: debugSample };
  });
  useEffect(() => {
    if (!debug) return;
    const w = window as Window & { __terraViewer?: unknown };
    w.__terraViewer = {
      get commands() {
        return commands.current;
      },
      get status() {
        return debugState.current.status;
      },
      get sample() {
        return debugState.current.sample;
      },
    };
    return () => {
      delete w.__terraViewer;
    };
  }, [debug]);

  const retry = () => {
    setError(null);
    setStatus("loading-asset");
    setAttempt((a) => a + 1);
  };
  const recoverContext = () => {
    setRecoveries((r) => r + 1);
    setStatus("loading-viewer");
    setCanvasKey((k) => k + 1);
  };

  const togglePanel = (p: "info" | "help") => setPanel((cur) => (cur === p ? null : p));
  const closePanel = () => {
    const was = panel;
    setPanel(null);
    requestAnimationFrame(() => container.current?.querySelector<HTMLButtonElement>(`[aria-controls="viewer-${was}"]`)?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape" || inputBlocked) return;
    if (panel) {
      e.stopPropagation();
      closePanel();
    } else if (fullscreen.expanded) {
      fullscreen.exitExpanded();
    }
  };

  const dragProps = onDropFiles
    ? {
        onDragOver: (e: DragEvent<HTMLDivElement>) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          if (!dragging) setDragging(true);
        },
        onDragLeave: (e: DragEvent<HTMLDivElement>) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        },
        onDrop: (e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragging(false);
          onDropFiles(e);
        },
      }
    : {};

  const tags = [meta.origin ? ORIGIN_TAG[meta.origin] : null, asset ? (asset.kind === "mesh" ? "3D model" : "Gaussian splat") : null, asset ? asset.format.toUpperCase() : null]
    .filter((t): t is string => !!t)
    .filter((t, i, all) => all.indexOf(t) === i);
  const ready = effectiveStatus === "ready";
  const loading = effectiveStatus === "loading-viewer" || effectiveStatus === "loading-asset";
  const showCanvas = started && webgl2 === true && !!asset && recoveries <= MAX_CONTEXT_RECOVERIES;

  return (
    <div
      ref={container}
      data-lenis-prevent
      onKeyDown={onKeyDown}
      {...dragProps}
      className={cn(
        "relative isolate overflow-hidden bg-[#121312] text-white",
        // In-page "expanded" fallback sits below the fixed Farmio header (78px bar; 112px from 1200).
        fullscreen.expanded && "!fixed inset-x-0 bottom-0 top-[78px] z-[40] desk:top-[112px]",
        fullscreen.native && "h-full w-full",
        className,
      )}
    >
      <p id="viewer-description" className="sr-only">
        Interactive 3D view of {meta.label}. Use the toolbar to switch between Orbit, Fly and Tour, reset the view or open Help for controls.
      </p>

      {showCanvas ? (
        <ViewerErrorBoundary
          key={canvasKey}
          fallback={(reset, err) => (
            <ViewerFallback
              kind="error"
              title="The 3D view stopped"
              message="Something went wrong while rendering. The rest of the page still works."
              details={[err.message]}
              posterUrl={meta.posterUrl}
              actions={[{ label: "Retry", primary: true, onClick: () => { reset(); recoverContext(); } }, ...(fallbackAction ? [fallbackAction] : [])]}
            />
          )}
        >
          <Canvas
            key={canvasKey}
            aria-describedby="viewer-description"
            role="img"
            aria-label={`3D view of ${meta.label}`}
            dpr={dprFor(asset.kind, quality, deviceRatio)}
            gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
            shadows="percentage"
            camera={{ fov: meta.defaultCamera?.fov ?? 45, near: 0.1, far: 5000, position: [0, 0, 10] }}
            onCreated={() => setStatus((s) => (s === "loading-viewer" ? "loading-asset" : s))}
            className="!absolute inset-0"
          >
            <ViewerScene
              asset={asset}
              label={meta.label}
              attempt={attempt}
              preset={meta.defaultCamera}
              tour={meta.tour}
              quality={quality}
              animate={animate}
              reducedMotion={reducedMotion}
              inputBlocked={inputBlocked || status === "context-lost"}
              flyAvailable={flyAvailable}
              debug={debug}
              commandsRef={commands}
              onStart={onStart}
              onProgress={onProgress}
              onLoaded={onLoaded}
              onError={onAssetError}
              onModeChange={setMode}
              onTourState={setTour}
              onFlyLook={setFlyLocked}
              onContextLost={onContextLost}
              onDebug={setDebugSample}
            />
          </Canvas>
        </ViewerErrorBoundary>
      ) : null}

      {!started && effectiveStatus === "idle" ? (
        <div className="absolute inset-0 z-[5] flex items-center justify-center">
          {meta.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- portable viewer core: no next/image
            <img src={meta.posterUrl} alt={`Preview of ${meta.label}`} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <button
            type="button"
            onClick={() => {
              setStarted(true);
              setStatus("loading-viewer");
            }}
            className="relative h-11 cursor-pointer rounded-[42px] bg-farm-lime px-5 fm-p16 text-farm-ink transition-colors duration-300 ease-farm hover:bg-farm-ink hover:text-farm-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-farm-lime"
          >
            View in 3D
          </button>
        </div>
      ) : null}

      {started && loading && webgl2 !== false ? <ViewerLoading status={effectiveStatus} progress={progress} /> : null}

      {effectiveStatus === "unsupported" ? (
        <ViewerFallback
          kind="unsupported"
          title="3D view unavailable on this device"
          message="This browser or graphics driver does not provide WebGL 2, which the viewer needs. Try an up-to-date Chrome, Edge, Firefox or Safari."
          posterUrl={meta.posterUrl}
          actions={[{ label: "Back to homepage", href: "/" }]}
        />
      ) : null}

      {effectiveStatus === "context-lost" ? (
        <ViewerFallback
          kind="error"
          title="Graphics paused"
          message={
            recoveries < MAX_CONTEXT_RECOVERIES
              ? "The browser reclaimed the graphics context (often after sleep or a GPU reset). Restart the viewer to continue."
              : "The graphics context was lost repeatedly, so the viewer stopped retrying."
          }
          posterUrl={meta.posterUrl}
          actions={recoveries < MAX_CONTEXT_RECOVERIES ? [{ label: "Restart viewer", primary: true, onClick: recoverContext }] : [{ label: "Back to homepage", href: "/" }]}
        />
      ) : null}

      {effectiveStatus === "error" && error ? (
        <ViewerFallback
          kind="error"
          title="Could not open this model"
          message={error.message}
          details={error.details}
          posterUrl={meta.posterUrl}
          actions={[
            ...(error.code === "fetch-failed" ? [{ label: "Retry", primary: true, onClick: retry }] : []),
            ...(fallbackAction ? [{ ...fallbackAction, primary: error.code !== "fetch-failed" }] : []),
          ]}
        />
      ) : null}

      <div className="pointer-events-none absolute left-3 top-3 z-[3] tab:left-4 tab:top-4">
        <ViewerMeta label={meta.label} tags={tags} status={effectiveStatus} />
      </div>

      {mode === "fly" && ready ? <FlyHint locked={flyLocked} /> : null}
      {mode === "cinematic" && ready ? (
        <TourBar
          tour={tour}
          onPlay={() => commands.current?.tourPlay()}
          onPause={() => commands.current?.tourPause()}
          onRestart={() => commands.current?.tourRestart()}
          onExit={() => commands.current?.tourExit()}
        />
      ) : null}

      {asset && panel === "info" ? (
        <InfoPanel
          meta={meta}
          asset={asset}
          stats={loaded?.handle.stats ?? null}
          warnings={loaded?.handle.warnings ?? []}
          loadMs={loaded?.loadMs ?? null}
          animation={{
            available: (loaded?.handle.animations.length ?? 0) > 0 && asset.kind === "mesh" && asset.mesh?.animation !== false,
            playing: animate,
            onToggle: () => setAnimate((a) => !a),
          }}
          onClose={closePanel}
        />
      ) : null}
      {panel === "help" ? <HelpPanel flyAvailable={flyAvailable} onClose={closePanel} /> : null}

      <ViewerToolbar
        mode={mode}
        flyAvailable={flyAvailable}
        tourAvailable={tour.available}
        ready={ready}
        fullscreen={fullscreen.active}
        panel={panel}
        actions={actions}
        onMode={(m) => commands.current?.setMode(m)}
        onReset={() => commands.current?.resetView()}
        onFullscreen={fullscreen.toggle}
        onPanel={togglePanel}
      />

      {dragging ? (
        <div className="pointer-events-none absolute inset-2 z-[6] flex items-center justify-center rounded-2xl border-2 border-dashed border-farm-lime bg-farm-night/70">
          <p className="max-w-[260px] text-center fm-p16 text-white">Drop a model and its textures to open it here. Nothing is uploaded.</p>
        </div>
      ) : null}

      {debug ? (
        <div className="pointer-events-none absolute bottom-[76px] left-3 z-[3] fm-p12 tabular-nums text-white/70 tab:bottom-[84px] tab:left-4">
          <p>
            WebGL2 · {asset?.kind}/{asset?.format} · q:{quality.id}
          </p>
          {debugSample ? (
            <p>
              {debugSample.fps.toFixed(0)} fps · {debugSample.drawCalls} calls · {debugSample.triangles.toLocaleString("en-US")} tris · dpr {debugSample.dpr} · geo {debugSample.geometries} · tex {debugSample.textures}
            </p>
          ) : null}
          {loaded ? <p>load {(loaded.loadMs / 1000).toFixed(2)} s</p> : null}
        </div>
      ) : null}
    </div>
  );
}
