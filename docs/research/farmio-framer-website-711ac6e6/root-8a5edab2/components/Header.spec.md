# Header — spec

- **Target:** `src/components/sites/farmio-framer-website-711ac6e6/shared/Header.tsx`
- **Screenshots:** `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/reference/vp-00.jpg`, `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/reference/menu-390.jpg`
- Values measured on the live reference unless marked proposed; see ../DESIGN_TOKENS.md.

## Spec

- Fixed, `z-60`, transparent bar. Desktop ≥1200: padding 32/30; white pill max 1320, radius 56, padding 8; logo 135×44; centred links (16px ink, 11/18 padding, radius 42, hover ink pill + white text); lime CTA "Contact us" (Button spec).
- Below 1200: padding 15/20; pill radius 20, padding 8/16/8/8; logo 100×33; 24×24 hamburger (3 × 24×2 ink bars, 6px gap) that morphs to an X.
- Open state: the same pill grows (grid-rows 0fr → 1fr, 400ms) to a 16px-padded list of 18px ink links with a 12px gap: Home, About us, Services, Gallery, Testimonials, **Viewroom** (added), Contact Us.
- Contract: `#site-menu` always mounted with `data-open` (read by the Viewroom's `useSiteMenuOpen`). While open: Lenis paused, body overflow hidden, Escape closes and refocuses the toggle, outside press / link / resize ≥1200 close.
- Active route (Viewroom): sand pill on desktop, underline in the menu (`aria-current="page"`).
