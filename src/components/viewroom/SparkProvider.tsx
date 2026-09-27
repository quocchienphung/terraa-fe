"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { SparkRenderer } from "@sparkjsdev/spark";
import { disposeObject } from "@/lib/viewroom/disposeObject";
import type { QualityProfile } from "@/lib/viewroom/quality";

/**
 * Mounts Spark's splat renderer into the viewport's existing scene, driven by the WebGLRenderer
 * that React Three Fiber created — no second renderer, canvas or animation loop. Spark sorts and
 * draws every SplatMesh in the scene from its `onBeforeRender`. Mounted only while a Gaussian
 * asset is shown, so mesh sessions never download or initialise Spark.
 */
export function SparkProvider({ quality }: { quality: QualityProfile }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    let disposed = false;
    let spark: SparkRenderer | null = null;
    import("@sparkjsdev/spark").then(({ SparkRenderer }) => {
      if (disposed) return;
      spark = new SparkRenderer({
        renderer: gl,
        onDirty: () => invalidate(),
        lodSplatScale: quality.lodSplatScale,
      });
      spark.name = "SparkRenderer";
      scene.add(spark);
      invalidate();
    });
    return () => {
      disposed = true;
      if (spark) {
        scene.remove(spark);
        // SparkRenderer.dispose() frees its targets/workers but not its own Mesh geometry and
        // material (measured: one geometry leaked per mount), so release the whole object.
        disposeObject(spark);
      }
    };
  }, [gl, scene, invalidate, quality.lodSplatScale]);

  return null;
}
