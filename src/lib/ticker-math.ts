/** Wraps a marquee offset into [0, runWidth) for either direction of travel. */
export function wrapOffset(offset: number, runWidth: number): number {
  if (!(runWidth > 0)) return 0;
  const r = offset % runWidth;
  return r < 0 ? r + runWidth : r;
}
