import type { Material, Object3D, Texture } from "three";

/**
 * Releases the GPU resources of a subtree the caller owns: geometries, materials, every texture
 * slot, skeleton bone textures, and objects with their own `dispose()` (e.g. Spark's SplatMesh).
 * Each resource is disposed once even when shared inside the subtree. Resources listed in
 * `keep` (shared with something else) are skipped. Returns the number of resources released.
 */
export function disposeObject(root: Object3D, keep: ReadonlySet<object> = new Set()): number {
  const seen = new Set<object>();
  let count = 0;
  const release = (res: { dispose: () => void } | null | undefined) => {
    if (!res || seen.has(res) || keep.has(res)) return;
    seen.add(res);
    res.dispose();
    count++;
  };

  root.traverse((obj) => {
    const node = obj as Object3D & {
      geometry?: { dispose: () => void };
      material?: Material | Material[];
      skeleton?: { dispose: () => void };
      dispose?: () => void;
    };
    if (node.geometry) release(node.geometry);
    const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
    for (const mat of materials) {
      for (const value of Object.values(mat)) {
        if (value && typeof value === "object" && (value as Texture).isTexture) release(value as Texture);
      }
      release(mat);
    }
    if (node.skeleton) release(node.skeleton);
    if (typeof node.dispose === "function") release(node as { dispose: () => void });
  });
  return count;
}
