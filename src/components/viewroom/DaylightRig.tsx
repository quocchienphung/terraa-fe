"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { DirectionalLight, Object3D } from "three";
import { boundsCenter, boundsRadius } from "@/lib/viewroom/cameraFit";
import type { Bounds } from "@/lib/viewroom/viewerTypes";

/**
 * Natural daylight for mesh assets: a sky/ground hemisphere, a warm sun casting soft shadows and a
 * cool bounce fill. Everything is sized from the asset bounds, so it works for any mesh. Gaussian
 * splats never get this rig — their captured radiance must not be relit.
 */
// Values chosen by rendering variants side by side against the Sketchfab reference ("bright and bold").
export const DAYLIGHT = {
  sky: "#e3eeff",
  ground: "#b09c80",
  hemisphere: 2.7,
  sun: "#fff1dc",
  sunIntensity: 4.2,
  /** Direction towards the sun (from the scene centre): high, from the front-right. */
  sunDir: [0.55, 1, 0.42] as const,
  fill: "#cfe0ff",
  fillIntensity: 1.1,
  fillDir: [-0.8, 0.35, -0.6] as const,
};

export function DaylightRig({ bounds, shadowMapSize, dynamicShadows }: { bounds: Bounds; shadowMapSize: number; dynamicShadows: boolean }) {
  const get = useThree((s) => s.get);
  const sun = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const target = useRef<Object3D>(null);
  const c = boundsCenter(bounds);
  const r = boundsRadius(bounds);
  const norm = (d: readonly number[]) => {
    const l = Math.hypot(d[0], d[1], d[2]);
    return [d[0] / l, d[1] / l, d[2] / l];
  };
  const sd = norm(DAYLIGHT.sunDir);
  const fd = norm(DAYLIGHT.fillDir);

  // Orthographic shadow frustum wrapped tightly around the bounding sphere.
  useLayoutEffect(() => {
    const light = sun.current;
    if (!light || !target.current) return;
    light.target = target.current;
    fill.current!.target = target.current;
    const cam = light.shadow.camera;
    cam.left = -r * 1.02;
    cam.right = r * 1.02;
    cam.top = r * 1.02;
    cam.bottom = -r * 1.02;
    cam.near = r * 0.5;
    cam.far = r * 3.5;
    cam.updateProjectionMatrix();
    light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = r * 0.0012;
    light.shadow.radius = 3;
    light.shadow.map?.dispose();
    light.shadow.map = null;
    get().gl.shadowMap.needsUpdate = true;
  }, [r, shadowMapSize, get]);

  // The scene is static: render the shadow map once per asset instead of every frame, unless an
  // embedded animation is playing.
  useEffect(() => {
    const { shadowMap } = get().gl;
    shadowMap.autoUpdate = dynamicShadows;
    shadowMap.needsUpdate = true;
    return () => {
      shadowMap.autoUpdate = true;
    };
  }, [get, dynamicShadows, bounds]);

  return (
    <>
      <object3D ref={target} position={c} />
      <hemisphereLight args={[DAYLIGHT.sky, DAYLIGHT.ground, DAYLIGHT.hemisphere]} />
      <directionalLight
        ref={sun}
        castShadow
        color={DAYLIGHT.sun}
        intensity={DAYLIGHT.sunIntensity}
        position={[c[0] + sd[0] * r * 2, c[1] + sd[1] * r * 2, c[2] + sd[2] * r * 2]}
      />
      <directionalLight
        ref={fill}
        color={DAYLIGHT.fill}
        intensity={DAYLIGHT.fillIntensity}
        position={[c[0] + fd[0] * r * 2, c[1] + fd[1] * r * 2, c[2] + fd[2] * r * 2]}
      />
    </>
  );
}
