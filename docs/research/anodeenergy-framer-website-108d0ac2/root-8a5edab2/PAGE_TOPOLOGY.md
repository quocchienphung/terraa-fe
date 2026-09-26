# Page Topology — anodeenergy.framer.website (homepage)

Source: https://anodeenergy.framer.website/ → destination route `/`
Framer breakpoints observed: **phone ≤ 809px**, **tablet 810–1199px**, **desktop ≥ 1200px** (768px renders the phone variant).
Smooth scroll: **Lenis** is active (`<html class="lenis">`). Document height 8934px @1440, 10075px @390.
No scroll-reveal ("appear") animations on text — everything is visible on load. Motion is limited to the behaviors listed in BEHAVIORS.md.

| # | Section (Framer name) | y @1440 | h @1440 | h @390 | bg | Interaction model |
|---|---|---|---|---|---|---|
| 0 | Anode Nav (fixed overlay, 86px, z10) | 0 | 86 | 72 | transparent | scroll-driven theme swap + click (menu overlay) |
| 1 | Hero | 0 | 1170 | 1198 | video (brightness .7) | static (looping muted video) |
| 2 | Client ticker (pill + logos + ruler) | 1170 | 434 | 318 | #fff | time-driven marquee |
| 3 | What We Do | 1604 | 641 | 709 | #fff | hover (arrow CTAs) |
| 4 | Our Solutions (3 sticky rows) | 2245 | 2066 | 2259 | #fff / panels #f5f5f5 | scroll-driven sticky stack + dim overlay |
| 5 | Global Footprint (globe map) | 4311 | 800 | 640 | #0a0a0a + image | time-driven (5s) + click |
| 6 | Featured Projects (carousel) | 5111 | 1116 | 812 | #fff | time-driven (~4.5s) + click + hover, scroll-snap |
| 7 | Testimonial | 6226 | 693 | 818 | #fff | time-driven (~7s) + click |
| 8 | News (4-col grid) | 6919 | 871 | 1996 | #fff | static |
| 9 | Pre-Footer CTA "Ready to build?" | 7790 | 540 | 506 | #121212 | time-driven (rotating tick rings) + hover |
| 10 | Footer | 8330 | 605 | 857 | #121212 + vector bg | hover (underline) |

Layout: all sections are `display:flex; flex-direction:column; align-items:center` with an inner "Container" (`max-width:1800px`). Page horizontal gutter is **32px** on desktop for hero/what-we-do, **8px** for projects/testimonial/news lists (headings inset by a further 24px), **16px** on phone. Nothing is horizontally scrollable except the projects list.

z-layers: nav (fixed, z 10) < menu overlay (fixed, z max). Hero video sits at z -1 inside its section. Solutions rows are `position: sticky; top: 0`.
