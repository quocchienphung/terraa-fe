"use client";

import { ArrowLeft, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { createLocalBundle, relativePathOf, type LocalBundle } from "@/lib/viewroom/localBundle";
import { DEV_FIXTURES, TOKYO_PROTOTYPE } from "@/lib/viewroom/viewerManifest";
import { ViewerError, type TerraModelManifest, type ViewerStatus } from "@/lib/viewroom/viewerTypes";
import { OpenModelMenu } from "./OpenModelMenu";
import { TerraViewport, type TerraViewportProps } from "./TerraViewport";
import { ToolButton } from "./ViewerHud";
import { useSiteMenuOpen } from "./useSiteMenuOpen";

type Selection = { type: "manifest"; manifest: TerraModelManifest } | { type: "local"; bundle: LocalBundle };

const SAMPLES = [TOKYO_PROTOTYPE, ...DEV_FIXTURES];

interface DroppedFile {
  file: File;
  path: string;
}

/** Walks dropped folders (progressive enhancement: `webkitGetAsEntry`), keeping relative paths. */
async function filesFromDrop(e: DragEvent<HTMLDivElement>): Promise<DroppedFile[]> {
  const items = Array.from(e.dataTransfer.items ?? []);
  const entries = items.map((i) => (typeof i.webkitGetAsEntry === "function" ? i.webkitGetAsEntry() : null));
  if (entries.length === 0 || entries.some((en) => en === null)) {
    return Array.from(e.dataTransfer.files).map((file) => ({ file, path: file.name }));
  }
  const out: DroppedFile[] = [];
  const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
      out.push({ file, path: prefix + file.name });
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        if (batch.length === 0) break;
        for (const child of batch) await walk(child, `${prefix}${entry.name}/`);
      }
    }
  };
  for (const en of entries) if (en) await walk(en, "");
  // A single dropped folder is the bundle root: strip it so paths match the model's references.
  const roots = new Set(out.map((f) => f.path.split("/")[0]));
  if (roots.size === 1 && out.every((f) => f.path.includes("/"))) {
    return out.map((f) => ({ ...f, path: f.path.split("/").slice(1).join("/") }));
  }
  return out;
}

/**
 * Viewroom page experience around the reusable TerraViewport: which model is shown, local file
 * import (browser-only), samples, and the "Back to Tokyo" escape hatch.
 */
export function ViewroomShell({ debug = false }: { debug?: boolean }) {
  const [selection, setSelection] = useState<Selection>({ type: "manifest", manifest: TOKYO_PROTOTYPE });
  const [importError, setImportError] = useState<ViewerError | null>(null);
  const menuOpen = useSiteMenuOpen();
  const bundles = useRef<LocalBundle[]>([]);
  const current = useRef<Selection>(selection);
  useEffect(() => {
    current.current = selection;
  }, [selection]);

  // Object URLs are revoked only once the next asset has settled (ready or failed), so no loader
  // is ever cut off mid-decode, and all of them on unmount.
  const revokeStale = useCallback(() => {
    const keep = current.current.type === "local" ? current.current.bundle : null;
    bundles.current = bundles.current.filter((b) => {
      if (b === keep) return true;
      b.revoke();
      return false;
    });
  }, []);
  useEffect(
    () => () => {
      for (const b of bundles.current) b.revoke();
      bundles.current = [];
    },
    [],
  );
  const onStatusChange = useCallback(
    (s: ViewerStatus) => {
      if (s === "ready" || s === "error") revokeStale();
    },
    [revokeStale],
  );

  const openFiles = useCallback((files: DroppedFile[]) => {
    try {
      const bundle = createLocalBundle(files);
      bundles.current.push(bundle);
      setImportError(null);
      setSelection({ type: "local", bundle });
    } catch (err) {
      setImportError(err instanceof ViewerError ? err : new ViewerError("decode-failed", "Those files could not be opened."));
    }
  }, []);

  const viewportAsset = useMemo<TerraViewportProps["asset"]>(
    () => (selection.type === "manifest" ? selection.manifest : selection.bundle.asset),
    [selection],
  );
  const viewportMeta = useMemo<TerraViewportProps["meta"]>(
    () =>
      selection.type === "local"
        ? {
            label: selection.bundle.label,
            origin: "local-file",
            notes: selection.bundle.ignored.length > 0 ? [`Ignored (not a model or texture): ${selection.bundle.ignored.join(", ")}`] : undefined,
          }
        : undefined,
    [selection],
  );

  const isTokyo = selection.type === "manifest" && selection.manifest.modelId === TOKYO_PROTOTYPE.modelId;
  const backToTokyo = useCallback(() => {
    setImportError(null);
    setSelection({ type: "manifest", manifest: TOKYO_PROTOTYPE });
  }, []);

  return (
    <div className="relative h-full w-full">
      <TerraViewport
        asset={viewportAsset}
        meta={viewportMeta}
        inputBlocked={menuOpen}
        debug={debug}
        onStatusChange={onStatusChange}
        onDropFiles={(e) => {
          filesFromDrop(e).then(openFiles, () => setImportError(new ViewerError("decode-failed", "The dropped files could not be read.")));
        }}
        fallbackAction={isTokyo ? undefined : { label: "Back to Tokyo", onClick: backToTokyo }}
        actions={
          <>
            {!isTokyo ? <ToolButton icon={ArrowLeft} label="Back to Tokyo" onClick={backToTokyo} /> : null}
            <OpenModelMenu
              samples={SAMPLES}
              currentId={selection.type === "manifest" ? selection.manifest.modelId : null}
              onFiles={(files) => openFiles(files.map((file) => ({ file, path: relativePathOf(file) })))}
              onSample={(manifest) => {
                setImportError(null);
                setSelection({ type: "manifest", manifest });
              }}
            />
          </>
        }
        className="h-full w-full"
      />
      {importError ? (
        <div role="alert" className="glass absolute left-1/2 top-3 z-[7] flex w-[min(440px,calc(100%-24px))] -translate-x-1/2 items-start gap-3 border border-white/10 py-2 pl-4 pr-1 text-white tab:top-4">
          <div className="flex-1 py-1.5">
            <p className="text-[14px] font-medium leading-[1.35] tracking-[-0.28px]">{importError.message}</p>
            {importError.details.length > 0 ? <p className="mt-1 break-words font-mono text-[11px] leading-4 text-white/60">{importError.details.join(" · ")}</p> : null}
          </div>
          <button type="button" aria-label="Dismiss" onClick={() => setImportError(null)} className="flex size-11 flex-none cursor-pointer items-center justify-center text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-brand">
            <X aria-hidden className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
