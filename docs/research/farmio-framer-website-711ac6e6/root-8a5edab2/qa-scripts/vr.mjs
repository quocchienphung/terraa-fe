import { chromium } from "playwright-core";
const OUT = "../../docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/viewroom";
const base = process.env.LOCAL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const log = [];
const status = (p) => p.evaluate(() => window.__terraViewer?.status ?? "none");
const waitReady = (p, t = 180000) => p.waitForFunction(() => window.__terraViewer?.status === "ready", null, { timeout: t });
for (const [vw, vh] of [[1440, 900], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log.push(`${vw} pageerror ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") log.push(`${vw} console.error ${m.text().slice(0, 160)}`); });
  await page.goto(base + "/viewroom", { waitUntil: "load" });
  await waitReady(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${vw}-01-tokyo-ready.png` });
  log.push(`${vw} ready: ${await status(page)}`);
  // info panel
  await page.getByRole("button", { name: "Info", exact: true }).click(); await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${vw}-02-info.png` });
  log.push(`${vw} info panel visible: ${await page.locator("#viewer-info").isVisible()} attribution: ${await page.locator("#viewer-info").innerText().then(t => /Source:/.test(t))}`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  log.push(`${vw} info closed by Esc: ${!(await page.locator("#viewer-info").isVisible().catch(() => false))}`);
  await page.getByRole("button", { name: "Help", exact: true }).click(); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${vw}-03-help.png` });
  await page.getByRole("button", { name: "Close controls" }).click();
  // open model menu
  await page.getByRole("button", { name: "Open model" }).click(); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${vw}-04-open-menu.png` });
  const samples = await page.getByRole("menuitemradio").allInnerTexts();
  log.push(`${vw} samples: ${samples.map(s => s.split("\n")[0]).join(" | ")}`);
  await page.keyboard.press("Escape");
  if (vw === 1440) {
    // tour
    await page.getByRole("button", { name: "Tour", exact: true }).click(); await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${vw}-05-tour.png` });
    log.push(`tour bar: ${await page.getByRole("group", { name: "Tour playback" }).isVisible()}`);
    await page.getByRole("button", { name: "Exit tour" }).click(); await page.waitForTimeout(800);
    // fly
    await page.getByRole("button", { name: "Fly", exact: true }).click(); await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${vw}-06-fly.png` });
    log.push(`fly mode pressed: ${await page.getByRole("button", { name: "Fly", exact: true }).getAttribute("aria-pressed")}`);
    await page.getByRole("button", { name: "Orbit", exact: true }).click(); await page.waitForTimeout(600);
    // gaussian sample
    await page.getByRole("button", { name: "Open model" }).click(); await page.waitForTimeout(300);
    await page.getByRole("menuitemradio").nth(1).click();
    await waitReady(page, 120000).catch(() => log.push("splat not ready"));
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${vw}-07-splat-sample.png` });
    log.push(`splat sample status: ${await status(page)} back-to-tokyo visible: ${await page.getByRole("button", { name: "Back to Tokyo" }).isVisible()}`);
    await page.getByRole("button", { name: "Back to Tokyo" }).click();
    await waitReady(page); await page.waitForTimeout(800);
    log.push(`back to tokyo: ${await status(page)}`);
    // fullscreen toggle (headless: Fullscreen API may be denied -> expanded fallback)
    await page.getByRole("button", { name: "Fullscreen" }).click(); await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${vw}-08-fullscreen.png` });
    await page.keyboard.press("Escape"); await page.waitForTimeout(600);
  } else {
    // phone: open header menu while viewer is live -> input lock
    await page.getByRole("button", { name: "Open menu" }).click(); await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/${vw}-05-menu-open.png` });
    log.push(`${vw} #site-menu data-open: ${await page.locator("#site-menu").getAttribute("data-open")}`);
    await page.keyboard.press("Escape"); await page.waitForTimeout(500);
    log.push(`${vw} menu closed: ${await page.locator("#site-menu").getAttribute("data-open")} focus on toggle: ${await page.evaluate(() => document.activeElement?.getAttribute("aria-controls"))}`);
  }
  await ctx.close();
}
console.log(log.join("\n"));
await browser.close();
