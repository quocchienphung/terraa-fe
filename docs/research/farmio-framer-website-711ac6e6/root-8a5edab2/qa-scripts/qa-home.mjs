import { chromium } from "playwright-core";
import fs from "node:fs";
const OUT = "../../docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/qa";
fs.mkdirSync(OUT, { recursive: true });
const base = process.env.LOCAL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const R = [];
const ok = (name, pass, extra = "") => R.push(`${pass ? "PASS" : "FAIL"}  ${name}${extra ? "  — " + extra : ""}`);
const errors = [];
const newPage = async (vw, vh, opts = {}) => {
  const p = await (await browser.newContext({ viewport: { width: vw, height: vh }, ...opts })).newPage();
  p.on("pageerror", (e) => errors.push(`${vw} ${e.message}`));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(`${vw} console ${m.text().slice(0, 200)}`);
  });
  return p;
};

// 1) Overflow + section order at many widths
for (const vw of [360, 390, 767, 768, 1199, 1200, 1440, 1920, 2560]) {
  const p = await newPage(vw, 900);
  await p.goto(base + "/", { waitUntil: "load" });
  const r = await p.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    ids: [...document.querySelectorAll("main > section")].map((s) => s.id || s.getAttribute("aria-label")).join(","),
  }));
  ok(`no horizontal overflow @${vw}`, r.sw <= r.cw, `scrollWidth ${r.sw} / ${r.cw}`);
  if (vw === 1440) ok("section order", r.ids === "home,Logo ticker,about,our-solutions,service,feature-section,global-view,how-it-works,gallery,team,testimonial,faq-section", r.ids);
  await p.context().close();
}

const p = await newPage(1440, 900);
await p.goto(base + "/", { waitUntil: "load" });
// 2) Ticker
const tickTop = await p.evaluate(() => document.querySelector("section[aria-label='Logo ticker']").getBoundingClientRect().top + scrollY);
await p.evaluate((y) => window.scrollTo(0, y - 200), tickTop);
await p.waitForTimeout(800);
const tx = () => p.evaluate(() => [...document.querySelectorAll("[data-ticker-track]")].map((t) => new DOMMatrix(getComputedStyle(t).transform).m41));
const a = await tx();
await p.waitForTimeout(1000);
const b = await tx();
const d0 = b[0] - a[0];
const d1 = b[1] - a[1];
ok("ticker logos move", Math.abs(d0) > 20, `logo ${d0.toFixed(1)} px in 1s`);
ok("ticker ruler moves faster than logos", Math.abs(d1) > Math.abs(d0), `ruler ${d1.toFixed(1)} px in 1s`);
await p.screenshot({ path: `${OUT}/ticker-1440.png`, clip: { x: 0, y: 100, width: 1440, height: 420 } });
await p.mouse.wheel(0, 300);
await p.waitForTimeout(120);
const c = await tx();
await p.waitForTimeout(400);
const d = await tx();
ok("ticker direction follows scroll", Math.sign(d[0] - c[0]) !== Math.sign(d0), `idle ${Math.sign(d0)} → after scroll-down ${Math.sign(d[0] - c[0])}`);
ok("ticker pause control present", (await p.getByRole("button", { name: /Pause logo ticker/ }).count()) === 1);

// 3) Globe (let the Lenis smooth-scroll started by the wheel above settle first)
await p.waitForTimeout(2000);
const gTop = await p.evaluate(() => document.getElementById("global-view").getBoundingClientRect().top + scrollY);
await p.evaluate((y) => window.scrollTo(0, y), gTop);
const globeReady = await p
  .waitForFunction(() => {
    const cv = document.querySelector("#global-view canvas");
    return !!cv && getComputedStyle(cv).opacity === "1";
  }, null, { timeout: 90000, polling: 500 })
  .then(() => true, () => false);
ok("globe WebGL ready (canvas visible)", globeReady);
await p.waitForTimeout(1500);
await p.mouse.move(5, 450);
await p.screenshot({ path: `${OUT}/globe-1440.png` });
const counter = () => p.locator("#global-view span.tabular-nums").innerText();
const c0 = await counter();
await p.getByRole("button", { name: "Next location" }).click();
await p.waitForTimeout(1300);
const c1 = await counter();
ok("globe next location", c0 !== c1, `${c0} → ${c1}`);
await p.getByRole("button", { name: "Previous location" }).click();
await p.waitForTimeout(1300);
ok("globe previous location", (await counter()) === c0);
const visiblePins = await p.evaluate(() => [...document.querySelectorAll("#global-view button[aria-pressed]")].filter((el) => el.getAttribute("aria-label")?.includes(",") && getComputedStyle(el).visibility === "visible").length);
ok("globe pins projected on the front face", visiblePins > 0, `${visiblePins} visible`);
await p.getByRole("button", { name: "Pause globe rotation" }).click();
await p.waitForTimeout(200);
ok("globe pause toggles", (await p.getByRole("button", { name: "Resume globe rotation" }).count()) === 1);
await p.getByRole("button", { name: "Resume globe rotation" }).click();
const hit = await p.evaluate(() => {
  const h = [...document.querySelectorAll("#global-view div[aria-hidden='true']")].find((el) => el.className.includes("cursor-grab"));
  if (!h || getComputedStyle(h).display === "none") return null;
  const r = h.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.6 };
});
ok("globe drag area laid out", !!hit);
if (hit) {
  await p.mouse.move(hit.x, hit.y);
  await p.mouse.down();
  await p.mouse.move(hit.x + 160, hit.y + 20, { steps: 12 });
  await p.mouse.up();
  await p.waitForTimeout(600);
  await p.mouse.move(5, 450);
  await p.screenshot({ path: `${OUT}/globe-1440-after-drag.png` });
}
const card = await p.evaluate(() => {
  const el = document.querySelector("#global-view [role=status]");
  return el ? el.innerText.split("\n").filter((l) => l.trim())[1] : null;
});
ok("globe location card shows selection", !!card, card ?? "");

// 4) Services
const sTop = await p.evaluate(() => document.getElementById("service").getBoundingClientRect().top + scrollY);
const seen = [];
for (let k = 0; k < 5; k++) {
  await p.evaluate((y) => window.scrollTo(0, y), sTop + k * 900 + 100);
  await p.waitForTimeout(600);
  seen.push(await p.evaluate(() => document.querySelector("#service li[aria-current=step] h3")?.textContent));
}
ok("services steps through all 5 (down)", new Set(seen).size === 5, seen.join(" / "));
await p.evaluate((y) => window.scrollTo(0, y), sTop + 900 + 100);
await p.waitForTimeout(600);
ok("services steps back up", (await p.evaluate(() => document.querySelector("#service li[aria-current=step] h3")?.textContent)) === seen[1]);
await p.evaluate((y) => window.scrollTo(0, y), sTop + 2 * 900 + 100);
await p.waitForTimeout(700);
await p.screenshot({ path: `${OUT}/services-1440-step3.png` });

// 5) FAQ
await p.locator("#faq-section").scrollIntoViewIfNeeded();
const openCount = () => p.evaluate(() => document.querySelectorAll("#faq-section button[aria-expanded=true]").length);
ok("faq first item open initially", (await openCount()) === 1);
const q3 = p.getByRole("button", { name: "Is Farmio available worldwide?" });
await q3.click();
await p.waitForTimeout(600);
ok("faq single-open", (await openCount()) === 1 && (await q3.getAttribute("aria-expanded")) === "true");
await q3.click();
await p.waitForTimeout(600);
ok("faq toggling the open item closes it", (await openCount()) === 0);
const questions = await p.locator("#faq-section button[aria-expanded]").allInnerTexts();
let allOpened = true;
for (let i = 0; i < questions.length; i++) {
  const btn = p.locator("#faq-section button[aria-expanded]").nth(i);
  await btn.click();
  await p.waitForTimeout(550);
  if ((await btn.getAttribute("aria-expanded")) !== "true") allOpened = false;
}
ok("faq every question opens", allOpened && questions.length === 6, `${questions.length} questions`);

// 6) Testimonials
await p.locator("#testimonial").scrollIntoViewIfNeeded();
await p.mouse.move(5, 5);
const pageIdx = () => p.evaluate(() => [...document.querySelectorAll("#testimonial [aria-label^='Show testimonial']")].findIndex((el) => el.getAttribute("aria-current") === "true"));
const page0 = await pageIdx();
await p.waitForTimeout(4300);
const page1 = await pageIdx();
ok("testimonials autoplay advances", page0 !== page1, `${page0} → ${page1}`);
await p.getByRole("button", { name: /Show testimonial 4 of 4/ }).click();
await p.waitForTimeout(1300);
ok("testimonials dot navigation", (await p.getByRole("button", { name: /Show testimonial 4 of 4/ }).getAttribute("aria-current")) === "true");

// 7) CTA hover
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
const btn = p.locator("#home a.fm-btn").first();
await btn.hover();
await p.waitForTimeout(800);
ok("CTA hover fills ink", (await btn.evaluate((el) => getComputedStyle(el).backgroundColor)) === "rgb(4, 48, 59)");
await p.context().close();

// 8) Navigation across routes
const n = await newPage(1440, 900);
await n.goto(base + "/viewroom", { waitUntil: "load" });
await n.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About us" }).click();
await n.waitForURL(/\/#about$/, { timeout: 30000 }).catch(() => {});
await n.waitForTimeout(1500);
ok("header anchor from /viewroom → /#about", n.url().endsWith("/#about"), n.url());
ok("landed on About section", await n.evaluate(() => Math.abs(document.getElementById("about").getBoundingClientRect().top) < 140));
await n.goBack();
await n.waitForTimeout(1500);
ok("browser Back returns to /viewroom", n.url().endsWith("/viewroom"), n.url());
await n.goto(base + "/", { waitUntil: "load" });
await n.locator("#home a.fm-btn").first().click();
await n.waitForURL(/contact-us/, { timeout: 30000 }).catch(() => {});
ok("hero CTA → /contact-us", n.url().endsWith("/contact-us"));
ok("contact page renders form", (await n.getByRole("button", { name: "Send your message" }).count()) === 1);
await n.screenshot({ path: `${OUT}/contact-1440.png`, fullPage: true });
await n.context().close();

// 9) Mobile menu
const m = await newPage(390, 844);
await m.goto(base + "/", { waitUntil: "load" });
await m.getByRole("button", { name: "Open menu" }).click();
await m.waitForTimeout(600);
await m.screenshot({ path: `${OUT}/menu-390.png`, clip: { x: 0, y: 0, width: 390, height: 420 } });
ok("mobile menu opens", (await m.locator("#site-menu").getAttribute("data-open")) === "true");
await m.locator("#site-menu").getByRole("link", { name: "Gallery" }).click();
await m.waitForTimeout(1500);
ok("mobile menu link navigates + closes", m.url().endsWith("/#gallery") && (await m.locator("#site-menu").getAttribute("data-open")) === "false", m.url());
await m.context().close();

// 10) Reduced motion
const rm = await newPage(1440, 900, { reducedMotion: "reduce" });
await rm.goto(base + "/", { waitUntil: "load" });
await rm.locator("#faq-section").scrollIntoViewIfNeeded();
await rm.waitForTimeout(500);
ok("reduced motion: headings visible", await rm.evaluate(() => [...document.querySelectorAll(".fm-word")].every((w) => getComputedStyle(w).opacity === "1")));
const tr = () => rm.evaluate(() => [...document.querySelectorAll("[data-ticker-track]")].map((t) => getComputedStyle(t).transform).join());
const t0 = await tr();
await rm.waitForTimeout(800);
ok("reduced motion: ticker still", t0 === (await tr()));
await rm.context().close();

console.log(R.join("\n"));
console.log("errors:", errors.length ? "\n" + errors.join("\n") : "none");
await browser.close();
