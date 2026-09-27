"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimationMixer, Box3, Group, Quaternion, Vector3 } from "three";
import { isAbortError, loadTerraAsset, type AssetHandle } from "@/lib/viewroom/adapters";
import { ViewerError, type Bounds, type LoadProgress, type Terra3DAsset } from "@/lib/viewroom/viewerTypes";

export interface LoadedAsset {
  handle: AssetHandle;
  /** Bounds after the manifest transform, in world space. */
  worldBounds: Bounds;
  loadMs: number;
}

interface AssetRendererProps {
  asset: Terra3DAsset;
  label: string;
  /** Changing this reloads the same asset (Retry). */
  attempt: number;
  animate: boolean;
  onStart: () => void;
  onProgress: (p: LoadProgress) => void;
  onLoaded: (loaded: LoadedAsset) => void;
  onError: (err: ViewerError) => void;
}

function toViewerError(err: unknown): ViewerError {
  if (err instanceof ViewerError) return err;
  return new ViewerError("decode-failed", "The model could not be loaded.", [String((err as Error)?.message ?? err)]);
}

/**
 * Loads the asset through the adapter registry and mounts it under a transform wrapper (the
 * source transform is never modified). One load session per asset: a superseded session is
 * aborted and, if it still resolves, its handle is disposed instead of being shown.
 */
export function AssetRenderer({ asset, label, attempt, animate, onStart, onProgress, onLoaded, onError }: AssetRendererProps) {
  const [handle, setHandle] = useState<AssetHandle | null>(null);
  const wrapper = useRef<Group>(null);
  const startedAt = useRef(0);
  const callbacks = useRef({ onStart, onProgress, onLoaded, onError });
  useLayoutEffect(() => {
    callbacks.current = { onStart, onProgress, onLoaded, onError };
  });

  useEffect(() => {
    const ac = new AbortController();
    let owned: AssetHandle | null = null;
    startedAt.current = performance.now();
    callbacks.current.onStart();
    loadTerraAsset(asset, {
      signal: ac.signal,
      label,
      onProgress: (p) => {
        if (!ac.signal.aborted) callbacks.current.onProgress(p);
      },
    })
      .then((h) => {
        if (ac.signal.aborted) {
          h.dispose();
          return;
        }
        owned = h;
        setHandle(h);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted || isAbortError(err)) return;
        callbacks.current.onError(toViewerError(err));
      });
    return () => {
      ac.abort();
      if (owned) {
        // Detach first so no frame can re-upload resources after they are released.
        owned.root.removeFromParent();
        owned.dispose();
      }
      setHandle(null);
    };
  }, [asset, label, attempt]);

  // Apply the manifest transform, then report world bounds once the object is in the scene.
  useLayoutEffect(() => {
    const group = wrapper.current;
    if (!handle || !group) return;
    const t = asset.transform;
    group.position.set(...(t?.position ?? [0, 0, 0]));
    group.quaternion.copy(t?.quaternion ? new Quaternion(...t.quaternion).normalize() : new Quaternion());
    group.scale.setScalar(t?.uniformScale ?? 1);
    group.updateMatrixWorld(true);
    const box = new Box3(new Vector3(...handle.bounds.min), new Vector3(...handle.bounds.max)).applyMatrix4(group.matrixWorld);
    callbacks.current.onLoaded({
      handle,
      worldBounds: { min: box.min.toArray(), max: box.max.toArray() },
      loadMs: performance.now() - startedAt.current,
    });
  }, [handle, asset.transform]);

  // Embedded animation (FBX/glTF clips), only when allowed.
  const mixer = useRef<AnimationMixer | null>(null);
  useEffect(() => {
    if (!handle || !animate || handle.animations.length === 0) return;
    const m = new AnimationMixer(handle.root);
    m.clipAction(handle.animations[0]).play();
    mixer.current = m;
    return () => {
      m.stopAllAction();
      m.uncacheRoot(handle.root);
      mixer.current = null;
    };
  }, [handle, animate]);
  useFrame((_, dt) => mixer.current?.update(Math.min(dt, 0.1)));

  if (!handle) return null;
  return (
    <group ref={wrapper} name="terra-asset">
      <primitive object={handle.root} dispose={null} />
    </group>
  );
}
