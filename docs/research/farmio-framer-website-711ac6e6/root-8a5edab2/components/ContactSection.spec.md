# ContactSection — spec

- **Target:** `src/components/sites/farmio-framer-website-711ac6e6/contact-us-0353b788/ContactSection.tsx`
- **Screenshots:** `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/qa/contact-1440.jpg`
- Values measured on the live reference unless marked proposed; see ../DESIGN_TOKENS.md.

## Spec

- White; padding 180/30/60 desktop. Left 630 (padding-right 40): tag, H1 `fm-h1` "Let’s talk about your farming needs", 16px copy, sand rule, phone and mail links (22px icons, 20px ink, underline on hover).
- Form 620: 1px sand outline, radius 20, padding 32; H4 title; labels 16px ink; inputs `#f3f3f3` radius 8, 44px; textarea 116px; "Send your message" pill.
- No backend: submit validates (first name, email, message) and opens a `mailto:` draft; the status line says nothing is sent from the page. The textarea placeholder says "Enter your message" (the reference's "Enter your name" is a template slip).
