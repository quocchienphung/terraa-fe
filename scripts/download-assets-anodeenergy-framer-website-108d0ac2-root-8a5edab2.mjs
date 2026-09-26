// Downloads the reference assets used by the anodeenergy.framer.website homepage clone.
// Run: node scripts/download-assets-anodeenergy-framer-website-108d0ac2-root-8a5edab2.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("public/images/reference");
const CDN = "https://framerusercontent.com";

const ASSETS = [
  ["hero-battery-storage.mp4", `${CDN}/assets/qQ0hXlWB0TgvJN7y7ttz5X73aU.mp4`],
  ["hero-battery-storage-poster.webp", `${CDN}/images/haJmXJqeoGIWYz1P0lqV8iAtq6w.webp`],
  ["solution-systems.webp", `${CDN}/images/Evxfl2EoH7zq1JD3kFgdOeFGls.webp?scale-down-to=2048`],
  ["solution-deployment.webp", `${CDN}/images/j8EKesZPjiOKB8DCl6mojUoi0L4.webp?scale-down-to=2048`],
  ["solution-software.webp", `${CDN}/images/eGcT5kEiho4cbvCvQFZu4jNuw.webp?scale-down-to=2048`],
  ["globe-night.webp", `${CDN}/images/xeHihJ3K58lbD4eNxIFmjpIdko0.webp`],
  ["project-bell-junction.webp", `${CDN}/images/kxqtw0u44kgDiv8u2VpJNUBqgXI.webp?scale-down-to=2048`],
  ["project-cedar-bayou.jpg", `${CDN}/images/7jTNwPyliC8PJK7jqtxGP06BJA.jpg?scale-down-to=2048`],
  ["project-marfa-flats.webp", `${CDN}/images/gowrnlcdeK3TZTjAlScYhkHdIQ.webp?scale-down-to=2048`],
  ["project-salt-fork.webp", `${CDN}/images/alNzdXkud9i2ei0TaPCkgFChk.webp?scale-down-to=2048`],
  ["news-desert-road.webp", `${CDN}/images/unwmeYVjjTy5v8j1TjWZwkjISuc.webp?scale-down-to=1024`],
  ["news-dam.webp", `${CDN}/images/9NABtPefeQ2112sDajVL58slKbM.webp?scale-down-to=1024`],
  ["testimonial-logo-cedar-bayou.svg", `${CDN}/images/SRqcWroKvYlh20ZQUDig7pZsujw.svg`],
  ["testimonial-logo-marfa-flats.svg", `${CDN}/images/m0NTlUuihFx1G4mYL3yJ00RrWaE.svg`],
  ["testimonial-logo-salt-fork.svg", `${CDN}/images/3sLpOXeaooMnd5pUM4fn8rlaX44.svg`],
  ["footer-vector-bg.png", `${CDN}/images/n4xkeuxYCj5mtKWuH0n1QmmIKi4.png`],
  ["footer-wordmark.svg", `${CDN}/images/DvqnUBs9F7fcACeY2s4BKPSMAsE.svg`],
  ["nav-logo.svg", `${CDN}/images/eW0vgjv5bcr89L3GFgQwhG63YI.svg`],
  ["favicon.jpg", `${CDN}/images/az1nbFvKrT7OFLZmKa0Wc4beZk.jpg`],
];

await mkdir(OUT, { recursive: true });

async function fetchOne([name, url]) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path.join(OUT, name), buf);
  return `${name} (${(buf.length / 1024).toFixed(0)} KB)`;
}

for (let i = 0; i < ASSETS.length; i += 4) {
  const batch = ASSETS.slice(i, i + 4);
  const results = await Promise.allSettled(batch.map(fetchOne));
  for (const r of results) console.log(r.status === "fulfilled" ? `ok   ${r.value}` : `FAIL ${r.reason}`);
}
