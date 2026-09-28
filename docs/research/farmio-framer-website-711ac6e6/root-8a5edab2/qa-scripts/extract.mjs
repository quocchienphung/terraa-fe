import { chromium } from "playwright-core";
import fs from "node:fs";
const vw = Number(process.argv[2] ?? 1440), vh = Number(process.argv[3] ?? 900);
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: vw, height: vh } })).newPage();
await page.goto("https://farmio.framer.website/", { waitUntil: "networkidle", timeout: 90000 });
const H = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H; y += 400) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(150); }
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1500);
const data = await page.evaluate(() => {
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.display === "none" || cs.visibility === "hidden") return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const nodes = [];
  const all = document.querySelectorAll("#main *");
  for (const el of all) {
    if (!vis(el)) continue;
    // skip if any ancestor is hidden
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const name = el.getAttribute("data-framer-name");
    const isText = el.children.length === 0 && el.textContent.trim().length > 0;
    const isImg = el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "svg";
    const sticky = cs.position === "sticky" || cs.position === "fixed";
    if (!name && !isText && !isImg && !sticky) continue;
    const depth = (() => { let d = 0, p = el; while (p && p.id !== "main") { p = p.parentElement; d++; } return d; })();
    nodes.push({
      d: depth, tag: el.tagName, name, text: isText ? el.textContent.trim().slice(0, 90) : undefined,
      x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height),
      pos: cs.position !== "static" && cs.position !== "relative" ? `${cs.position} top:${cs.top}` : undefined,
      bg: cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : undefined,
      bgi: cs.backgroundImage !== "none" ? cs.backgroundImage.slice(0, 160) : undefined,
      br: cs.borderRadius !== "0px" ? cs.borderRadius : undefined,
      border: cs.borderTopWidth !== "0px" ? `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}` : undefined,
      pad: cs.padding !== "0px" ? cs.padding : undefined, gap: cs.gap !== "normal" ? cs.gap : undefined,
      op: cs.opacity !== "1" ? cs.opacity : undefined, tf: cs.transform !== "none" ? cs.transform : undefined,
      bf: cs.backdropFilter !== "none" ? cs.backdropFilter : undefined, sh: cs.boxShadow !== "none" ? cs.boxShadow : undefined,
      font: isText ? `${cs.fontFamily.split(",")[0]} ${cs.fontSize}/${cs.lineHeight} w${cs.fontWeight} ls${cs.letterSpacing} ${cs.color} ${cs.fontVariationSettings} ${cs.textAlign}` : undefined,
      src: el.tagName === "IMG" ? el.currentSrc : el.tagName === "VIDEO" ? el.currentSrc : undefined,
      fit: el.tagName === "IMG" ? `${cs.objectFit} ${cs.objectPosition}` : undefined,
      href: el.tagName === "A" ? el.getAttribute("href") : undefined,
    });
  }
  const fonts = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight} ${f.style}`);
  return { nodes, fonts };
});
fs.writeFileSync(`dom-${vw}.json`, JSON.stringify(data, null, 0));
console.log(data.nodes.length, "nodes"); console.log([...new Set(data.fonts)].join("\n"));
await browser.close();
