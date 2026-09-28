# Testimonials — spec

- **Target:** `src/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/Testimonials.tsx`
- **Screenshots:** `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/compare/1440-testimonials.jpg`
- Values measured on the live reference unless marked proposed; see ../DESIGN_TOKENS.md.

## Spec

- Mist; padding 120/30/96 (80/30/80, 60/20/60). Header row: title block 529 (tag, H2) + 18px copy 465, bottom-aligned; tablet 428 + 280; phone stacked.
- Track starts at the container's left edge, overflow visible (neighbours peek), `gap 24`. Card 767 desktop / container width below: white, radius 20, padding 24 (20 phone); content 377: quote icon 28, quote H5 (normal wrap), name 16px ink, role 14px body; photo 312×270 (tablet 260) radius 10; phone photo on top.
- Autoplay every 2s (start to start), 1s slide `cubic-bezier(0.45,0,0.2,1)`, infinite (three copies + silent re-centre). Hover/focus pauses; reduced motion disables autoplay; dots (4 × 10px white, active 100% / 50%, pill black/20); swipe >50px.
