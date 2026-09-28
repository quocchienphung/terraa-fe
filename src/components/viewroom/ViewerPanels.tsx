"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { formatLabel } from "@/lib/viewroom/detectFormat";
import type { AssetOrigin, AssetStats, AssetWarning, Terra3DAsset } from "@/lib/viewroom/viewerTypes";

export interface ViewerMetaInfo {
  label: string;
  origin?: AssetOrigin;
  attribution?: string;
  notes?: string[];
  captureTime?: string;
  reconstructedAt?: string;
  approvedAt?: string;
  coverage?: string;
  sourceImageCount?: number;
  snapshotVersion?: string;
  qualityStatus?: string;
}

function Panel({ id, title, onClose, children }: { id: string; title: string; onClose: () => void; children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="pointer-events-auto absolute right-3 top-3 z-[4] flex max-h-[calc(100%-150px)] w-[min(340px,calc(100%-24px))] flex-col overflow-hidden rounded-[20px] bg-white text-farm-ink shadow-[0_12px_32px_rgba(0,0,0,0.25)] tab:right-4 tab:top-4 tab:max-h-[calc(100%-100px)]"
    >
      <header className="flex items-center justify-between border-b border-farm-ink/10 py-1 pl-5 pr-1">
        <h3 ref={heading} id={`${id}-title`} tabIndex={-1} className="fm-p16 text-farm-ink focus:outline-none">
          {title}
        </h3>
        <button
          type="button"
          aria-label={`Close ${title.toLowerCase()}`}
          onClick={onClose}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full text-farm-ink transition-colors hover:bg-farm-sand focus-visible:outline-2 focus-visible:outline-farm-ink"
        >
          <X aria-hidden className="size-4" strokeWidth={1.75} />
        </button>
      </header>
      <div className="overflow-y-auto px-5 pb-5 pt-3" data-lenis-prevent>
        {children}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-farm-ink/10 py-2 fm-p14">
      <dt className="text-farm-body/70">{k}</dt>
      <dd className="text-right text-farm-ink">{v}</dd>
    </div>
  );
}

const fmtBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const fmtNum = (n: number) => n.toLocaleString("en-US");

export function InfoPanel({
  meta,
  asset,
  stats,
  warnings,
  loadMs,
  animation,
  onClose,
}: {
  meta: ViewerMetaInfo;
  asset: Terra3DAsset;
  stats: AssetStats | null;
  warnings: AssetWarning[];
  loadMs: number | null;
  animation: { available: boolean; playing: boolean; onToggle: () => void; disabledReason?: string };
  onClose: () => void;
}) {
  const provenance: [string, string | number | undefined][] = [
    ["Captured", meta.captureTime],
    ["Reconstructed", meta.reconstructedAt],
    ["Approved", meta.approvedAt],
    ["Coverage", meta.coverage],
    ["Source images", meta.sourceImageCount],
    ["Snapshot", meta.snapshotVersion],
    ["Review status", meta.qualityStatus],
  ];
  const shownProvenance = provenance.filter(([, v]) => v !== undefined && v !== "");
  return (
    <Panel id="viewer-info" title="Model info" onClose={onClose}>
      {meta.origin === "prototype" ? (
        <p className="mb-3 rounded-xl bg-farm-sand px-3 py-2 fm-p14 text-farm-ink">
          Prototype mesh used to demonstrate the viewer. It is not a Terra capture and not a Gaussian Splatting reconstruction.
        </p>
      ) : null}
      {meta.origin === "dev-fixture" ? (
        <p className="mb-3 rounded-xl bg-farm-sand px-3 py-2 fm-p14 text-farm-ink">
          Development fixture: a real Gaussian splat used to test the viewer. It is not a Terra tree.
        </p>
      ) : null}
      {meta.origin === "local-file" ? (
        <p className="mb-3 rounded-xl bg-farm-sand px-3 py-2 fm-p14 text-farm-ink">Opened from this device. Nothing was uploaded.</p>
      ) : null}
      <dl>
        <Row k="Type" v={asset.kind === "mesh" ? "3D mesh" : "Gaussian splat"} />
        <Row k="Format" v={formatLabel(asset.format)} />
        {asset.sizeBytes ? <Row k="File size" v={fmtBytes(asset.sizeBytes)} /> : null}
        {stats?.triangles ? <Row k="Triangles" v={fmtNum(stats.triangles)} /> : null}
        {stats?.splats ? <Row k="Gaussians" v={fmtNum(stats.splats)} /> : null}
        {stats?.meshes ? <Row k="Meshes" v={fmtNum(stats.meshes)} /> : null}
        {stats?.materials ? <Row k="Materials" v={fmtNum(stats.materials)} /> : null}
        {stats?.textures ? <Row k="Textures" v={fmtNum(stats.textures)} /> : null}
        {loadMs !== null ? <Row k="Load time" v={`${(loadMs / 1000).toFixed(1)} s`} /> : null}
        {shownProvenance.map(([k, v]) => (
          <Row key={k} k={k} v={String(v)} />
        ))}
      </dl>

      {animation.available ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="fm-p14 text-farm-body">{animation.disabledReason ?? "Embedded animation"}</p>
          <button
            type="button"
            aria-pressed={animation.playing}
            onClick={animation.onToggle}
            className="h-11 cursor-pointer rounded-full bg-farm-sand px-4 fm-p14 text-farm-ink transition-colors hover:bg-farm-ink hover:text-farm-sand focus-visible:outline-2 focus-visible:outline-farm-ink"
          >
            {animation.playing ? "Pause animation" : "Play animation"}
          </button>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mt-4">
          <p className="fm-p12 text-farm-body/70">Known limitations</p>
          <ul className="mt-2 flex flex-col gap-2">
            {warnings.map((w) => (
              <li key={w.message} className="fm-p14 text-farm-ink">
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {meta.notes && meta.notes.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {meta.notes.map((n) => (
            <li key={n} className="fm-p12 text-farm-body">
              {n}
            </li>
          ))}
        </ul>
      ) : null}
      {meta.attribution ? <p className="mt-4 fm-p12 text-farm-body">Source: {meta.attribution}</p> : null}
    </Panel>
  );
}

function HelpGroup({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="fm-p12 text-farm-body/70">{title}</p>
      <dl className="mt-1">
        {items.map(([k, v]) => (
          <Row key={k} k={k} v={v} />
        ))}
      </dl>
    </div>
  );
}

export function HelpPanel({ flyAvailable, onClose }: { flyAvailable: boolean; onClose: () => void }) {
  return (
    <Panel id="viewer-help" title="Controls" onClose={onClose}>
      <HelpGroup
        title="Orbit"
        items={[
          ["Rotate", "Drag · one finger"],
          ["Pan", "Right-drag · two fingers"],
          ["Zoom", "Scroll · pinch"],
        ]}
      />
      {flyAvailable ? (
        <HelpGroup
          title="Fly (keyboard + mouse)"
          items={[
            ["Look", "Click scene, move mouse"],
            ["Move", "W A S D or arrows"],
            ["Down / up", "Q / E"],
            ["Faster", "Hold Shift"],
            ["Release / exit", "Esc, then Esc again"],
          ]}
        />
      ) : (
        <p className="mt-4 fm-p14 text-farm-body">Fly mode needs a keyboard and mouse, so it is hidden on touch devices.</p>
      )}
      <HelpGroup
        title="Tour"
        items={[
          ["Playback", "Play · Pause · Restart"],
          ["Take control", "Drag or scroll the scene"],
        ]}
      />
      <p className="mt-4 fm-p12 text-farm-body">
        Open model reads files on this device only; nothing is uploaded. Supported: FBX, GLB, glTF, OBJ, and Gaussian splats as PLY, SPZ, SOG, SPLAT, KSPLAT.
      </p>
    </Panel>
  );
}
