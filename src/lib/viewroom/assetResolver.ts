import type { LocalResource, ResourcePolicy } from "./viewerTypes";

/** 1×1 mid-grey PNG served for resources the asset is known not to ship (no 404 round trip). */
export const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNoaGgAAAMEAYFL09IQAAAAAElFTkSuQmCC";
/** Empty payload for missing non-image resources: loaders fail fast instead of fetching. */
export const PLACEHOLDER_EMPTY = "data:application/octet-stream;base64,";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|tga|psd|tiff?|ktx2|dds)$/i;

export interface ResolutionReport {
  /** Names requested but not supplied (after aliasing). */
  missing: string[];
  /** Names that matched more than one selected file by basename. */
  ambiguous: string[];
  /** `requested → resolved` for aliases that were applied. */
  aliased: string[];
}

/** Normalises slashes, decodes `%20`, strips `./` and leading `../` segments. */
export function normalizeResourcePath(path: string): string {
  let p = path.replace(/\\/g, "/");
  try {
    p = decodeURIComponent(p);
  } catch {
    // keep the raw value when it is not valid percent-encoding
  }
  const parts: string[] = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      parts.pop();
      continue;
    }
    parts.push(seg);
  }
  return parts.join("/");
}

export function baseName(path: string): string {
  const n = normalizeResourcePath(path.split(/[?#]/, 1)[0]);
  return n.slice(n.lastIndexOf("/") + 1);
}

function placeholderFor(name: string): string {
  return IMAGE_EXT.test(name) ? PLACEHOLDER_IMAGE : PLACEHOLDER_EMPTY;
}

/**
 * Builds the URL modifier handed to three's LoadingManager for one load session. `blob:` and
 * `data:` URLs always pass through untouched.
 */
export function createResourceResolver(policy: ResourcePolicy | undefined): {
  resolve: (url: string) => string;
  report: ResolutionReport;
} {
  const report: ResolutionReport = { missing: [], ambiguous: [], aliased: [] };
  const note = (list: string[], v: string) => {
    if (!list.includes(v)) list.push(v);
  };

  if (!policy || policy.type === "none") {
    return { resolve: (url) => url, report };
  }

  if (policy.type === "remote") {
    const aliases = policy.aliases ?? {};
    const missing = new Set((policy.missing ?? []).map((m) => m.toLowerCase()));
    const base = policy.baseUrl.endsWith("/") ? policy.baseUrl : `${policy.baseUrl}/`;
    return {
      report,
      resolve(url) {
        if (url.startsWith("blob:") || url.startsWith("data:")) return url;
        const name = baseName(url);
        const key = name.toLowerCase();
        if (missing.has(key)) {
          note(report.missing, name);
          return placeholderFor(name);
        }
        const alias = aliases[key];
        if (alias) {
          note(report.aliased, `${name} → ${alias}`);
          return base + encodeURIComponent(alias);
        }
        return url;
      },
    };
  }

  const files = policy.files;
  return {
    report,
    resolve(url) {
      if (url.startsWith("blob:") || url.startsWith("data:")) return url;
      const hit = matchLocalResource(files, url);
      if (hit.kind === "found") return hit.file.url;
      const name = baseName(url);
      note(hit.kind === "ambiguous" ? report.ambiguous : report.missing, name);
      return placeholderFor(name);
    },
  };
}

export type LocalMatch =
  | { kind: "found"; file: LocalResource }
  | { kind: "ambiguous"; candidates: LocalResource[] }
  | { kind: "missing" };

/**
 * Resolves a requested resource against the visitor's selection only: exact relative path, then
 * path suffix, then a unique basename. Absolute URLs and author machine paths never hit the network.
 */
export function matchLocalResource(files: LocalResource[], requested: string): LocalMatch {
  const clean = requested.split(/[?#]/, 1)[0];
  // An absolute http(s) URL is never fetched from a local bundle; only its file name is tried.
  const path = /^[a-z][a-z0-9+.-]*:\/\//i.test(clean) ? baseName(clean) : normalizeResourcePath(clean);
  const want = path.toLowerCase();
  if (!want) return { kind: "missing" };

  const norm = files.map((f) => ({ f, p: normalizeResourcePath(f.path).toLowerCase() }));
  const exact = norm.filter((n) => n.p === want);
  if (exact.length === 1) return { kind: "found", file: exact[0].f };

  const suffix = norm.filter((n) => n.p.endsWith(`/${want}`) || want.endsWith(`/${n.p}`));
  if (suffix.length === 1) return { kind: "found", file: suffix[0].f };

  const name = want.slice(want.lastIndexOf("/") + 1);
  const byName = norm.filter((n) => n.p.slice(n.p.lastIndexOf("/") + 1) === name);
  if (byName.length === 1) return { kind: "found", file: byName[0].f };
  if (byName.length > 1) return { kind: "ambiguous", candidates: byName.map((n) => n.f) };
  return { kind: "missing" };
}
