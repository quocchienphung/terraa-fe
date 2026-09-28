# Button — spec

- **Target:** `src/components/sites/farmio-framer-website-711ac6e6/shared/PillButton.tsx`
- **Screenshots:** `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/compare/1440-hero.jpg`
- Values measured on the live reference unless marked proposed; see ../DESIGN_TOKENS.md.

## Spec

- 44px, radius 42, padding 9/20, gap 10, lime `#e7f352`, 16px ink label, 16×15 arrow.
- Hover/focus-visible: fill → ink, text → sand, ~0.6s; the ink arrow slides 20px right out of a 16px mask while a sand arrow slides in from −20px.
- Hover colours are Tailwind utilities on the element: a `.fm-btn:hover` rule in the components layer loses to the `bg-farm-lime` utility.
