// Usage: node compare.mjs <vw> <vh> [sections comma list] — writes cmp/<vw>/<section>.png (ref | local)
import { chromium } from "playwright-core";
import fs from "node:fs";
import { PNG } from "pngjs";
const vw = Number(process.argv[2] ?? 1440), vh = Number(process.argv[3] ?? 900);
const only = process.argv[4]?.split(",");
const LOCAL = process.env.LOCAL ?? "http://localhost:3000";
const OUT = `cmp/${vw}`; fs.mkdirSync(OUT, { recursive: true });
const SECTIONS = {
  hero: ["section[data-framer-name='Hero Section']", "#home"],
  about: ["#about", "#about"],
  solutions: ["#our-solutions", "#our-solutions"],
  services: ["#service", "#service", "viewport"],
  features: ["#feature-section", "#feature-section"],
  how: ["section[data-framer-name='How It Work Section']", "#how-it-works"],
  gallery: ["#gallery", "#gallery"],
  team: ["#team", "#team"],
  testimonials: ["#testimonial", "#testimonial"],
  faq: ["#faq-section", "#faq-section"],
  cta: ["[data-framer-name='CTA & Footer']", "footer >> xpath=.."],
};
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function open(url) {
  const page = await (await browser.newContext({ viewport: { width: vw, height: vh } })).newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.addStyleTag({ content: "#__framer-badge-container{display:none!important}" });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += Math.round(vh * 0.5)) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(160); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  return page;
}
async function shot(page, sel, mode) {
  const loc = page.locator(sel).first();
  if (mode === "viewport") {
    const top = await loc.evaluate((e) => e.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => window.scrollTo(0, y + 10), top); await page.waitForTimeout(1200);
    return page.screenshot();
  }
  await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
  const box = await loc.evaluate((e) => { const r = e.getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; });
  await page.evaluate((y) => window.scrollTo(0, y), box.y); await page.waitForTimeout(900);
  // full-height element capture, header hidden so it does not cover the section
  await page.addStyleTag({ content: "header,nav[data-framer-name]{visibility:hidden!important} [data-framer-name='Desktop'][data-framer-name]{}" });
  const buf = await loc.screenshot({ animations: "disabled" });
  await page.addStyleTag({ content: "header,nav[data-framer-name]{visibility:visible!important}" });
  return buf;
}
const ref = await open("https://farmio.framer.website/");
const loc = await open(LOCAL + "/");
const sideBySide = (a, b) => { const A = PNG.sync.read(a), B = PNG.sync.read(b); const w = A.width + B.width + 20, h = Math.max(A.height, B.height); const o = new PNG({ width: w, height: h }); o.data.fill(255); PNG.bitblt(A, o, 0, 0, A.width, A.height, 0, 0); PNG.bitblt(B, o, 0, 0, B.width, B.height, A.width + 20, 0); return PNG.sync.write(o); };
for (const [name, [rs, ls, mode]] of Object.entries(SECTIONS)) {
  if (only && !only.includes(name)) continue;
  try { const a = await shot(ref, rs, mode); const b = await shot(loc, ls, mode); fs.writeFileSync(`${OUT}/${name}.png`, sideBySide(a, b)); console.log("ok", name); }
  catch (e) { console.log("fail", name, e.message.split("\n")[0]); }
}
await browser.close();
