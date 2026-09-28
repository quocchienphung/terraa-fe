import { chromium } from "playwright-core";
const OUT = "../../docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/viewroom";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
for (const [vw, vh] of [[1440, 900], [768, 1024], [390, 844], [1920, 1080]]) {
  const page = await (await browser.newContext({ viewport: { width: vw, height: vh } })).newPage();
  await page.goto("http://localhost:3000/viewroom", { waitUntil: "load" });
  await page.waitForFunction(() => window.__terraViewer?.status === "ready", null, { timeout: 180000 });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => { const g = document.querySelector("[role=group][aria-label='Camera mode']").getBoundingClientRect(); const m = document.querySelector("[role=group][aria-label='Model']").getBoundingClientRect(); return { toolbarBottom: Math.round(g.bottom), modelBottom: Math.round(m.bottom), vh: innerHeight, docW: document.documentElement.scrollWidth }; });
  console.log(vw, JSON.stringify(r));
  await page.screenshot({ path: `${OUT}/${vw}-00-first-screen.png` });
}
await browser.close();
