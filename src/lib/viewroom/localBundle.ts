import { FORMAT_REGISTRY, RESOURCE_EXTENSIONS, fileExtension, isAssetFormat } from "./detectFormat.ts";
import { ViewerError, type LocalResource, type Terra3DAsset } from "./viewerTypes.ts";

/** Hard cap per file: bigger files are refused before any decode is attempted. */
export const MAX_LOCAL_FILE_BYTES = 1024 * 1024 * 1024;
/** Above this, decoding can take seconds and a lot of memory: warn but continue. */
export const LARGE_FILE_BYTES = 200 * 1024 * 1024;

export interface PickedEntry {
  path: string;
  size: number;
}

/** Pure selection rules: exactly one model file; everything else must be a known sidecar type. */
export function pickMainEntry(entries: PickedEntry[]): { main: number; ignored: string[] } {
  if (entries.length === 0) throw new ViewerError("empty-file", "No files were selected.");
  const models = entries.map((e, i) => ({ e, i })).filter(({ e }) => isAssetFormat(fileExtension(e.path)));
  if (models.length === 0) {
    throw new ViewerError(
      "unsupported-format",
      "None of the selected files is a supported model.",
      [`Supported: ${Object.keys(FORMAT_REGISTRY).map((f) => `.${f}`).join(", ")}`],
    );
  }
  if (models.length > 1) {
    throw new ViewerError(
      "ambiguous-selection",
      "Select one model at a time (plus its textures or buffers).",
      models.map(({ e }) => e.path),
    );
  }
  const main = models[0];
  if (main.e.size === 0) throw new ViewerError("empty-file", `${main.e.path} is empty.`);
  if (main.e.size > MAX_LOCAL_FILE_BYTES) {
    throw new ViewerError("too-large", `${main.e.path} is larger than the 1 GB limit for local files.`);
  }
  const sidecar = new Set<string>(RESOURCE_EXTENSIONS);
  const ignored = entries.filter((e, i) => i !== main.i && !sidecar.has(fileExtension(e.path))).map((e) => e.path);
  return { main: main.i, ignored };
}

export interface LocalBundle {
  asset: Terra3DAsset;
  label: string;
  ignored: string[];
  /** Revokes every object URL. Idempotent; call only once no loader can still read them. */
  revoke: () => void;
}

/** Browser-only: wraps the picked files in object URLs. Nothing is uploaded anywhere. */
export function createLocalBundle(files: { file: File; path: string }[]): LocalBundle {
  const { main, ignored } = pickMainEntry(files.map(({ file, path }) => ({ path, size: file.size })));
  const resources: LocalResource[] = [];
  let mainUrl = "";
  files.forEach(({ file, path }, i) => {
    if (i !== main && ignored.includes(path)) return;
    const url = URL.createObjectURL(file);
    if (i === main) mainUrl = url;
    else resources.push({ path, url, size: file.size });
  });
  const mainFile = files[main];
  const format = fileExtension(mainFile.path);
  if (!isAssetFormat(format)) throw new ViewerError("unsupported-format", `${mainFile.path} is not supported.`);
  const base = {
    url: mainUrl,
    fileName: mainFile.file.name,
    sizeBytes: mainFile.file.size,
    resources: { type: "local" as const, files: resources },
  };
  const asset: Terra3DAsset =
    FORMAT_REGISTRY[format].kind === "mesh"
      ? { ...base, kind: "mesh", format: format as "fbx" | "glb" | "gltf" | "obj" }
      : { ...base, kind: "gaussian-splat", format: format as "ply" | "spz" | "sog" | "splat" | "ksplat" };

  let revoked = false;
  return {
    asset,
    label: mainFile.file.name,
    ignored,
    revoke() {
      if (revoked) return;
      revoked = true;
      URL.revokeObjectURL(mainUrl);
      for (const r of resources) URL.revokeObjectURL(r.url);
    },
  };
}

/** Relative path for a picked/dropped file (`webkitRelativePath` minus the chosen root folder). */
export function relativePathOf(file: File, dropPath?: string): string {
  const rel = dropPath ?? (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? "";
  if (!rel) return file.name;
  const parts = rel.replace(/^\/+/, "").split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : parts[0];
}
