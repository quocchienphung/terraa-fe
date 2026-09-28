# Viewroom — spec

- **Target:** `src/app/viewroom/page.tsx + src/components/viewroom/*`
- **Screenshots:** `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/viewroom/*.jpg`
- Values measured on the live reference unless marked proposed; see ../DESIGN_TOKENS.md.

## Spec

- **Derived design, no Farmio reference.** Mist section: tag "Viewroom", H1 "Explore in 3D.", 18px copy (max 465), frame radius 20 on `#121312` (scene colour), sized so the toolbar fits the first screen: `max(420, 100svh−370)` / `max(480, 100svh−320)` / `max(520, 100svh−316)`.
- Toolbar groups: night/60 glass capsules (radius 28, 1px white/10, blur 12); pill buttons 44px, 14px text, active lime/ink, white tooltip.
- Meta card, panels, loading, error/unsupported cards, import alert, open-model menu: white cards (radius 16–20), ink text, sand accents, lime primary pill; status dot lime (ready) / `#ff2244` (error).
- Expanded (non-native) fullscreen starts below the fixed header: top 78 / 112.
