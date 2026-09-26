import { test } from "node:test";
import assert from "node:assert/strict";
import { wrapOffset } from "../src/lib/ticker-math.ts";
import { groupWordsIntoLines, tokenizeWords } from "../src/lib/split-lines.ts";
import { smoothstep01 } from "../src/lib/motion-config.ts";

test("wrapOffset stays in [0, run) in both directions and at the boundary", () => {
  const run = 3320.84;
  assert.equal(wrapOffset(run, run), 0);
  assert.ok(Math.abs(wrapOffset(run + 5, run) - 5) < 1e-9);
  assert.ok(Math.abs(wrapOffset(-5, run) - (run - 5)) < 1e-9);
  assert.ok(Math.abs(wrapOffset(-run * 3 - 1, run) - (run - 1)) < 1e-6);
  assert.equal(wrapOffset(10, 0), 0);
  // Stepping across the loop point moves by exactly the step (no jump).
  const before = wrapOffset(run - 0.4, run);
  const after = wrapOffset(run - 0.4 + 0.7, run);
  assert.ok(Math.abs(((after - before + run) % run) - 0.7) < 1e-9);
});

test("groupWordsIntoLines follows rendered tops, tolerates sub-pixel jitter", () => {
  const lines = groupWordsIntoLines([
    { text: "We ", top: 0 },
    { text: "build, ", top: 0.6 },
    { text: "deploy ", top: 55.2 },
    { text: "and ", top: 55 },
    { text: "run", top: 110 },
  ]);
  assert.deepEqual(lines, ["We build,", "deploy and", "run"]);
});

test("hard line breaks always end a line", () => {
  const words = tokenizeWords("bidirectional\npower conversion");
  assert.deepEqual(
    words.map((w) => [w.text, w.hardBreakAfter]),
    [
      ["bidirectional", true],
      ["power ", false],
      ["conversion", false],
    ],
  );
  // Even if both halves happened to sit at the same top.
  assert.deepEqual(groupWordsIntoLines(words.map((w) => ({ ...w, top: 0 }))), ["bidirectional", "power conversion"]);
});

test("Solutions dim curve matches the samples taken on the reference", () => {
  // (next row top px, measured overlay opacity) at 1440×900, covered row ≈ 650px tall.
  const samples: [number, number][] = [
    [600, 0.006],
    [500, 0.056],
    [400, 0.137],
    [300, 0.233],
    [200, 0.325],
    [100, 0.393],
    [0, 0.42],
  ];
  for (const [top, measured] of samples) {
    const modelled = 0.42 * smoothstep01(1 - top / 650);
    assert.ok(Math.abs(modelled - measured) < 0.01, `${top}: ${modelled.toFixed(3)} vs ${measured}`);
  }
});
