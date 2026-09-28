// Which heavy stacks load on each route (production build). Markers are strings that only exist in
// the respective library bundles.
import { chromium } from "playwright-core";
const base = "http://localhost:3100";
const MARKERS = {
  fiber: /react-three-fiber|__r3f|useFrame must be used/,
  spark: /sparkjsdev|SplatMesh|SparkRenderer/,
  three: /THREE\.WebGLRenderer|WebGLRenderer: Context Lost|three\.module/,
  fbx: /FBXLoader|Kaydara FBX/,
};
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
async function check(path, scrollAll, waitReady) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const bodies = [];
  const assets = [];
  page.on("response", async (r) => {
    const u = r.url();
    if (/\.js(\?|$)/.test(u)) bodies.push(await r.text().catch(() => ""));
    if (/\.(fbx|ply|spz|sog|glb|gltf)(\?|$)/i.test(u) || /3d%20tokyo|viewroom\//.test(u)) assets.push(u.replace(base, ""));
  });
  await page.goto(base + path, { waitUntil: "load" });
  if (scrollAll) {
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 450) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(120); }
    await page.waitForTimeout(3000);
  }
  if (waitReady) await page.waitForFunction(() => /Ready/i.test(document.body.innerText), null, { timeout: 180000, polling: 500 });
  await page.waitForTimeout(1500);
  const all = bodies.join("\n");
  const found = Object.fromEntries(Object.entries(MARKERS).map(([k, re]) => [k, re.test(all)]));
  console.log(path, JSON.stringify(found), "3D assets:", assets.length ? assets.slice(0, 6).join(", ") : "none");
  await page.context().close();
}
await check("/", true, false);
await check("/viewroom", false, true);
await browser.close();
