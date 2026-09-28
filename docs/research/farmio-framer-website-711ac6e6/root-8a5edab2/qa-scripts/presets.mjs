import fs from "node:fs";
const html = fs.readFileSync("home.html", "utf8");
const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
fs.writeFileSync("all.css", css);
// walk top-level: media blocks and rules
const out = {};
const re = /(@media[^{]*)\{((?:[^{}]*\{[^{}]*\})*)\}|([^{}@]+)\{([^{}]*)\}/g;
let m;
while ((m = re.exec(css))) {
  const handle = (media, sel, body) => {
    const pm = sel.match(/framer-styles-preset-([a-z0-9]+)/);
    if (!pm) return;
    const key = pm[1];
    const props = {};
    for (const d of body.split(";")) { const i = d.indexOf(":"); if (i < 0) continue; const k = d.slice(0, i).trim(); const v = d.slice(i + 1).trim(); if (/font-size|letter-spacing|line-height|font-weight$|text-color|font-family$|open-type|paragraph-spacing|text-alignment|text-transform|font-variation-axes$/.test(k)) props[k.replace("--framer-", "")] = v; }
    out[key] ??= {}; out[key][media || "base"] = { ...(out[key][media || "base"] || {}), ...props };
  };
  if (m[1]) { const inner = m[2]; for (const r of inner.matchAll(/([^{}]+)\{([^{}]*)\}/g)) handle(m[1].replace("@media", "").trim(), r[1], r[2]); }
  else handle("", m[3], m[4]);
}
for (const [k, v] of Object.entries(out)) { console.log("== preset", k); for (const [mq, p] of Object.entries(v)) console.log("  ", mq, JSON.stringify(p)); }
