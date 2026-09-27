"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { NeutralToneMapping, NoToneMapping, type Material, type Mesh, type Object3D, type Scene } from "three";
import type { QualityProfile } from "@/lib/viewroom/quality";
import type { CameraMode, CameraPreset, LoadProgress, Terra3DAsset, TourKeyframe, ViewerError } from "@/lib/viewroom/viewerTypes";
import { AssetRenderer, type LoadedAsset } from "./AssetRenderer";
import { CameraController } from "./CameraController";
import { DaylightRig } from "./DaylightRig";
import { SparkProvider } from "./SparkProvider";
import type { TourState, ViewerCommands } from "./viewerCommands";

export interface DebugSample {
  drawCalls: number;
  triangles: number;
  dpr: number;
  fps: number;
  geometries: number;
  textures: number;
  programs: number;
}

export interface ViewerSceneProps {
  asset: Terra3DAsset;
  label: string;
  attempt: number;
  preset?: CameraPreset;
  tour?: TourKeyframe[];
  quality: QualityProfile;
  animate: boolean;
  reducedMotion: boolean;
  inputBlocked: boolean;
  flyAvailable: boolean;
  debug: boolean;
  commandsRef: RefObject<ViewerCommands | null>;
  onStart: () => void;
  onProgress: (p: LoadProgress) => void;
  onLoaded: (loaded: LoadedAsset) => void;
  onError: (err: ViewerError) => void;
  onModeChange: (mode: CameraMode) => void;
  onTourState: (state: TourState) => void;
  onFlyLook: (locked: boolean) => void;
  onContextLost: () => void;
  onDebug?: (sample: DebugSample) => void;
}

function DebugProbe({ onDebug }: { onDebug: (s: DebugSample) => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  // Development-only: lets automated checks inspect the live scene.
  useEffect(() => {
    const w = window as Window & { __terraViewerScene?: Scene };
    w.__terraViewerScene = scene;
    return () => {
      delete w.__terraViewerScene;
    };
  }, [scene]);
  const acc = useRef({ frames: 0, time: 0 });
  useFrame((_, dt) => {
    const a = acc.current;
    a.frames++;
    a.time += dt;
    if (a.time < 0.5) return;
    onDebug({
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      dpr: gl.getPixelRatio(),
      fps: a.frames / a.time,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs?.length ?? 0,
    });
    a.frames = 0;
    a.time = 0;
  });
  return null;
}

/** Opaque surfaces cast and receive sun shadows; decals and see-through materials do not cast. */
function enableShadows(root: Object3D) {
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh || mesh.userData.terraRole === "shadow-decal") return;
    const mats: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mesh.receiveShadow = true;
    mesh.castShadow = mats.every((m) => !m.transparent || m.alphaTest > 0);
  });
}

export function ViewerScene(props: ViewerSceneProps) {
  const { asset, quality, onLoaded, onContextLost } = props;
  const gl = useThree((s) => s.gl);
  const [loaded, setLoaded] = useState<LoadedAsset | null>(null);
  const contextLost = useRef(onContextLost);
  useLayoutEffect(() => {
    contextLost.current = onContextLost;
  });

  useEffect(() => {
    const el = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      contextLost.current();
    };
    el.addEventListener("webglcontextlost", lost);
    return () => el.removeEventListener("webglcontextlost", lost);
  }, [gl]);

  const handleStart = props.onStart;
  const onStart = useCallback(() => {
    setLoaded(null);
    handleStart();
  }, [handleStart]);
  const handleLoaded = useCallback(
    (l: LoadedAsset) => {
      if (l.handle.needsLights) enableShadows(l.handle.root);
      setLoaded(l);
      onLoaded(l);
    },
    [onLoaded],
  );

  const bounds = loaded?.worldBounds ?? null;
  const needsLights = loaded?.handle.needsLights ?? asset.kind === "mesh";
  const lights = useMemo(
    () => (bounds && needsLights ? <DaylightRig bounds={bounds} shadowMapSize={quality.id === "mobile" ? 1024 : 2048} dynamicShadows={props.animate} /> : null),
    [bounds, needsLights, quality.id, props.animate],
  );

  // Meshes: neutral tone mapping keeps the painted atlas colours while taming the sun highlights.
  // Splats: none — the reconstruction's captured colours are shown as-is.
  const get = useThree((s) => s.get);
  useEffect(() => {
    const renderer = get().gl;
    renderer.toneMapping = asset.kind === "mesh" ? NeutralToneMapping : NoToneMapping;
    renderer.toneMappingExposure = 1;
  }, [get, asset.kind]);

  return (
    <>
      <color attach="background" args={["#121312"]} />
      {lights}
      {asset.kind === "gaussian-splat" ? <SparkProvider quality={quality} /> : null}
      <AssetRenderer
        asset={asset}
        label={props.label}
        attempt={props.attempt}
        animate={props.animate}
        onStart={onStart}
        onProgress={props.onProgress}
        onLoaded={handleLoaded}
        onError={props.onError}
      />
      <CameraController
        bounds={bounds}
        preset={props.preset}
        tour={props.tour}
        reducedMotion={props.reducedMotion}
        inputBlocked={props.inputBlocked}
        flyAvailable={props.flyAvailable}
        commandsRef={props.commandsRef}
        onModeChange={props.onModeChange}
        onTourState={props.onTourState}
        onFlyLook={props.onFlyLook}
      />
      {props.debug && props.onDebug ? <DebugProbe onDebug={props.onDebug} /> : null}
    </>
  );
}
