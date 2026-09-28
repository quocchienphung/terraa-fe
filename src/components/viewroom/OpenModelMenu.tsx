"use client";

import { FolderOpen } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatLabel } from "@/lib/viewroom/detectFormat";
import { ORIGIN_LABEL } from "@/lib/viewroom/viewerManifest";
import type { TerraModelManifest } from "@/lib/viewroom/viewerTypes";
import { ToolButton } from "./ViewerHud";

const ACCEPT = [".fbx", ".glb", ".gltf", ".obj", ".mtl", ".bin", ".png", ".jpg", ".jpeg", ".webp", ".tga", ".ply", ".spz", ".sog", ".splat", ".ksplat"].join(",");

export function OpenModelMenu({
  samples,
  currentId,
  onFiles,
  onSample,
}: {
  samples: TerraModelManifest[];
  currentId: string | null;
  onFiles: (files: File[]) => void;
  onSample: (m: TerraModelManifest) => void;
}) {
  const [open, setOpen] = useState(false);
  const [folderSupported, setFolderSupported] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const filesInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const menuId = useId();

  useEffect(() => {
    const input = folderInput.current;
    if (!input) return;
    const supported = "webkitdirectory" in input;
    if (supported) input.setAttribute("webkitdirectory", "");
    setFolderSupported(supported);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    root.current?.addEventListener("keydown", onKey);
    const el = root.current;
    return () => {
      document.removeEventListener("pointerdown", onDown);
      el?.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (input: HTMLInputElement | null) => {
    setOpen(false);
    input?.click();
  };
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length > 0) onFiles(files);
  };

  const item = "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left fm-p14 text-farm-ink hover:bg-farm-sand focus-visible:bg-farm-sand focus-visible:outline-none";

  return (
    <div ref={root} className="relative">
      <ToolButton ref={button} icon={FolderOpen} label="Open model" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} active={open} onClick={() => setOpen((v) => !v)} />
      <input ref={filesInput} type="file" multiple accept={ACCEPT} className="hidden" onChange={onChange} tabIndex={-1} aria-hidden />
      <input ref={folderInput} type="file" multiple className="hidden" onChange={onChange} tabIndex={-1} aria-hidden />
      {open ? (
        <div id={menuId} role="menu" aria-label="Open model" className="absolute right-0 top-full z-10 mt-2 w-[min(320px,calc(100vw-24px))] rounded-[20px] bg-white p-2 text-farm-ink shadow-[0_12px_32px_rgba(0,0,0,0.25)] tab:bottom-[calc(100%+12px)] tab:top-auto tab:mt-0">
          <button type="button" role="menuitem" className={item} onClick={() => pick(filesInput.current)} autoFocus>
            <span>Choose files…</span>
            <span className="fm-p12 text-farm-body/70">Model + textures</span>
          </button>
          {folderSupported ? (
            <button type="button" role="menuitem" className={item} onClick={() => pick(folderInput.current)}>
              <span>Choose folder…</span>
              <span className="fm-p12 text-farm-body/70">glTF / OBJ bundle</span>
            </button>
          ) : null}
          <p className="px-3 pb-2 pt-1 fm-p12 text-farm-body">Files stay on this device. Drag and drop onto the viewer also works.</p>
          <div className="mx-3 my-1 h-px bg-farm-ink/10" />
          <p className="px-3 pb-1 pt-2 fm-p12 text-farm-body/70">Samples</p>
          {samples.map((s) => (
            <button
              key={s.modelId}
              type="button"
              role="menuitemradio"
              aria-checked={s.modelId === currentId}
              className={cn(item, s.modelId === currentId && "bg-farm-mist")}
              onClick={() => {
                setOpen(false);
                onSample(s);
              }}
            >
              <span className="flex items-center gap-2">
                {s.modelId === currentId ? <span aria-hidden className="size-2 flex-none rounded-full bg-farm-ink" /> : null}
                {s.label}
              </span>
              <span className="text-right fm-p12 text-farm-body/70">
                {formatLabel(s.format).replace("Gaussian splat", "Splat")} · {ORIGIN_LABEL[s.origin]}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
