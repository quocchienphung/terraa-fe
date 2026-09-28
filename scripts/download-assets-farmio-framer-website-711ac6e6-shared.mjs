// Downloads the Farmio reference assets (https://farmio.framer.website/) into public/ and src/app/fonts.
// Raster images are saved as-is; run scripts/convert-images-farmio-framer-website-711ac6e6-shared.py afterwards to produce the WebP files the app uses.
// Usage: node scripts/download-assets-farmio-framer-website-711ac6e6-shared.mjs
import fs from "node:fs";
import path from "node:path";

const IMG = "https://framerusercontent.com/images/";
const ASSET = "https://framerusercontent.com/assets/";

/** local name → source (section in comments). Sizes are the originals Framer serves. */
const IMAGES = {
  "logo.svg": "ugabjNKN6DO4f5E9WynUJ77Z8w.svg", // header + footer, 135×44
  "hero-field.png": "w8BxcgOTdrnm1oAx9APIWHAr7Y.png", // hero background, 2880×1600
  "solution-precision.png": "zNmcQyo07DxCT3RJxPq6gaYORh0.png", // solutions card 1, 1275×1614
  "solution-management.png": "3jG5Dq23m4D3GRcwL5L9qpH3pgo.png", // solutions card 2, 1275×1614
  "solution-sustainable.png": "JAGzNWPJfggBCr1mBmpRz68ZHug.png", // solutions card 3, 850×1532
  "service-1-bg.png": "PvCp32weG5JkDiZA50WLEDc33S0.png", // services panel backgrounds
  "service-2-bg.png": "o4O1rkfHcP4NVZLe6RUPh9ju8.png",
  "service-3-bg.png": "Yn65LO0TzUXQEx7nFLupeZxycUo.png",
  "service-4-bg.png": "kU1LyGOp2lq412yFefbraS0A.png",
  "service-5-bg.png": "znwoT9yqd0qIIlVsLEnXZRi3zU.png",
  "service-1.png": "zlRjhLi53i0xqjhzJz7TQPnCzV0.png", // services card images
  "service-2.png": "TsnDBzzzDviYNEHVue597g4xp0.png",
  "service-3.png": "d8hLyjPBxNCMTBDy3uIC2eWPnSg.png",
  "service-4.png": "SNtFJxxzgJop82HUzYYKfGTeE.png",
  "service-5.png": "Rvme5hRNyk19wmGXNRlgBXRlcg.png",
  "features-roots.png": "IPWo9z3eXexOEYGaQAQGTKE.png", // features image
  "gallery-1.png": "oYXjemMnzb9vtQvXsP0V7SX4Dk.png", // gallery col 1 top
  "gallery-2.png": "7XKnGc026abQfYS8j1Rdxn5RRU.png", // col 1 bottom
  "gallery-3.png": "6gwj2IyXc941vE8Zxy3orojMs.png", // col 2 top
  "gallery-4.png": "w6fqwux0gdSLbPtHpejYUgu8haA.png", // col 2 bottom
  "gallery-5.png": "DSmJZc0j65RxDJDSPJ8HYpBPCQA.png", // col 3 (full height)
  "gallery-6.png": "XVYKmKt8ypTr26u52MgZ2TID8.png", // col 4 top
  "gallery-7.png": "DLRQ9dumihhqI477xE98hEDJwV4.png", // col 4 bottom
  "team-sarah-wilson.png": "tUo1rL436kuG7vtydKbnapPdR4A.png",
  "team-michael-brown.png": "O2xOHPRp2AADEUZgV6DsLAR97k.png",
  "team-john-carter.png": "pBNrv3GP1QZlbk4tGkRlMMLbT0.png",
  "testimonial-john-miller.png": "aqxH6VqIauduTKTjqJyK4V0gfdE.png",
  "testimonial-hasan-ali.png": "gZ8XM3MKRCp5BE8YfyBJzY68.png",
  "testimonial-rahim-ahmed.png": "R9XCyj6VzdnJirbBfoPgjrRUc0.png",
  "testimonial-amina-khatun.png": "Eub9U3fk5lEWBmLtLVgphjdTN0.png",
  "faq-drone.png": "oQHhmcHGOAYy6mYwmkX5upOaDcI.png",
  "cta-field.png": "JvFZfXaAfe9KTLVPyGYPaXnna0.png",
};

const FILES = [
  { url: `${ASSET}Np45wly46PBKqCGM0tXpdJqVAo.mp4`, out: "public/sites/farmio-framer-website-711ac6e6/shared/videos/farming-in-motion.mp4" }, // hero media card
  // BDO Grotesk Variable (SIL Open Font License), the only face the reference loads.
  { url: `${ASSET}FcybOZJ2ipUdK2dQmwN3gFVAvuk.woff2`, out: "src/app/fonts/BDOGroteskVariable.woff2" },
];

async function save(url, out) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("text/html")) throw new Error(`HTML instead of a file: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
  console.log(`${out}  ${(buf.length / 1024).toFixed(0)} KB  ${type}`);
}

const jobs = [
  ...Object.entries(IMAGES).map(([name, id]) => ({ url: IMG + id, out: `public/sites/farmio-framer-website-711ac6e6/shared/images/${name}` })),
  ...FILES,
];
const queue = [...jobs];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) await save(job.url, job.out);
  }),
);
