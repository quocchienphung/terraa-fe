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

  const item = "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] leading-[1.3] tracking-[-0.26px] text-white hover:bg-white/[0.08] focus-visible:bg-white/[0.08] focus-visible:outline-none min-h-11";

  return (
    <div ref={root} className="relative">
      <ToolButton ref={button} icon={FolderOpen} label="Open model" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} active={open} onClick={() => setOpen((v) => !v)} />
      <input ref={filesInput} type="file" multiple accept={ACCEPT} className="hidden" onChange={onChange} tabIndex={-1} aria-hidden />
      <input ref={folderInput} type="file" multiple className="hidden" onChange={onChange} tabIndex={-1} aria-hidden />
      {open ? (
        <div id={menuId} role="menu" aria-label="Open model" className="glass absolute right-0 top-full z-10 mt-2 w-[min(300px,calc(100vw-24px))] border border-white/10 py-1 tab:bottom-[calc(100%+12px)] tab:top-auto tab:mt-0">
          <button type="button" role="menuitem" className={item} onClick={() => pick(filesInput.current)} autoFocus>
            <span>Choose files…</span>
            <span className="font-mono text-[10px] uppercase text-white/50">Model + textures</span>
          </button>
          {folderSupported ? (
            <button type="button" role="menuitem" className={item} onClick={() => pick(folderInput.current)}>
              <span>Choose folder…</span>
              <span className="font-mono text-[10px] uppercase text-white/50">glTF / OBJ bundle</span>
            </button>
          ) : null}
          <p className="px-3 pb-2 pt-1 text-[11px] leading-[1.35] text-white/50">Files stay on this device. Drag and drop onto the viewer also works.</p>
          <div className="my-1 h-px bg-white/10" />
          <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase leading-4 text-white/50">Samples</p>
          {samples.map((s) => (
            <button
              key={s.modelId}
              type="button"
              role="menuitemradio"
              aria-checked={s.modelId === currentId}
              className={cn(item, s.modelId === currentId && "text-brand")}
              onClick={() => {
                setOpen(false);
                onSample(s);
              }}
            >
              <span>{s.label}</span>
              <span className="text-right font-mono text-[10px] uppercase text-white/50">
                {formatLabel(s.format).replace("Gaussian splat", "Splat")} · {ORIGIN_LABEL[s.origin]}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
