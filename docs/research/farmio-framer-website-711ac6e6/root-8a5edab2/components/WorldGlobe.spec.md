# WorldGlobe — spec

- **Target:** `src/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/WorldGlobe.tsx`
- **Screenshots:** `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/qa/globe-1440.jpg`, `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/qa/globe-1440-after-drag.jpg`, `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/qa/globe-390.jpg`, `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/baseline-before-redesign/globe-1440.jpg`
- Values measured on the live reference unless marked proposed; see ../DESIGN_TOKENS.md.

## Spec

- Retained, not in Farmio. Night `#0a0a0a` section, height min(90vh,640) → min(90vh,800) from 768 (unchanged framing inputs).
- Title: "Global view" tag + H2 white "A living view of our planet" (neutral copy), top 88 / 100.
- Engine and interaction contract unchanged: `EarthCanvas` + `useGlobeController` (lazy mount, poster fallback, pins, focus tween, hold/Pause, drag area with touch gutters).
- Chrome in Farmio style: lime active pin/pulse; white location card (radius 16, sand kind chip, `fm-h5` name, 14px body), 300 wide next to the pin ≥768 and docked above the bar on phones; legend 12px + "Sample locations · demo data"; round 36px glass buttons (hover lime), tabular counter, Pause pill.
- Card bottom reserve raised to 96px for the taller legend (CardLayout option).
