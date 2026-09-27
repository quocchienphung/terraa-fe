import { ViewerError, type LoadProgress } from "../viewerTypes.ts";

/**
 * Downloads the main asset with real byte progress and real cancellation. A byte total is only
 * reported when it is trustworthy: `Content-Length` of an uncompressed response.
 */
export async function fetchAsset(
  url: string,
  { signal, onProgress, label }: { signal: AbortSignal; onProgress: (p: LoadProgress) => void; label: string },
): Promise<Uint8Array<ArrayBuffer>> {
  let res: Response;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new ViewerError("fetch-failed", `Could not download ${label}.`, [String((err as Error)?.message ?? err)]);
  }
  if (!res.ok) throw new ViewerError("fetch-failed", `Could not download ${label} (HTTP ${res.status}).`);

  const encoded = (res.headers.get("content-encoding") ?? "identity") !== "identity";
  const lengthHeader = Number(res.headers.get("content-length"));
  let total = !encoded && Number.isFinite(lengthHeader) && lengthHeader > 0 ? lengthHeader : undefined;

  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer());
    onProgress({ phase: "fetching", loaded: buf.byteLength, total: buf.byteLength });
    return buf;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  let lastReport = 0;
  onProgress({ phase: "fetching", loaded: 0, total });
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    if (total !== undefined && loaded > total) total = undefined;
    const now = performance.now();
    if (now - lastReport > 100) {
      lastReport = now;
      onProgress({ phase: "fetching", loaded, total });
    }
  }
  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  if (out.byteLength === 0) throw new ViewerError("empty-file", `${label} is empty.`);
  onProgress({ phase: "fetching", loaded, total: loaded });
  return out;
}
