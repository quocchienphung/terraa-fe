# Behaviors

Scroll was tested before click in every section. "Observed" means measured on the live reference; "implemented" is what the clone does.

| Behavior | Observed on reference | Implemented |
| --- | --- | --- |
| Smooth scroll | `html.lenis` (Framer smooth-scroll component) | existing single Lenis instance kept (`SmoothScroll`), paused while the menu is open, off with reduced motion |
| Header | fixed; no change on scroll | same; links are absolute (`/#about`) so they work from any route |
| Nav link hover | white pill → ink, text white | same (300ms) |
| CTA hover | lime → ink fill, text → sand, ink arrow slides out right while a sand arrow slides in (~0.6s) | same (`.fm-btn`, hover colours as utilities) |
| Mobile menu | hamburger → X; pill grows to 323px with 6 links (18px) | same; plus Viewroom link; Escape / outside press / link / resize ≥1200 close it; focus returns to the toggle on Escape |
| Heading reveal | word by word: opacity 0 + blur(4px) → visible, ~0.55s, ~60ms stagger, on entering the viewport | `WordReveal`: SSR-visible; only headings below the fold at hydration are hidden and replayed; reduced motion never hides |
| Services | section 5×100vh; sticky panel `top: 40px`; the component switches variant when each 100vh trigger passes the viewport top; whole panel crossfades (~0.35–0.4s) | active index = floor(scroll into section / viewport height); background photos and cards crossfade 400ms; heading rendered once; phones: static list |
| Testimonials | Framer slideshow, left-aligned at the container edge with neighbours visible; advances one card every ~2s (start to start), ~1s slide, infinite loop; 4 dots (10px, active 100% / others 50%, pill `rgba(0,0,0,.2)`) | same timing; three copies of the list for a seamless wrap; pauses on hover/focus, no autoplay with reduced motion; dots jump to the nearest matching card; horizontal swipe moves it |
| FAQ | first item open; single-open; clicking the open item closes it; height animates ~0.5s | same (grid-rows transition), `aria-expanded` / region |
| Hero video | 218×130 autoplay, muted, loop, inline | same file |
| Stats | static text (no counters observed) | static |
| Footer links | underline grows on hover | same |
| Logo ticker † | previous site: logos 40 px/s, ruler 56 px/s, scroll-coupled direction/speed, runs only near viewport + visible tab, stops for reduced motion, hidden Pause button on focus | unchanged engine (`TickerMotion`) |
| Earth † | previous site: lazy WebGL mount, drag with inertia, steering, pins, card following the pin (desktop) / docked (phone), prev/next focus tween, Pause, hover/focus hold, touch scroll gutters, sleep offscreen/hidden, context-loss/texture fallback to the poster | unchanged engine (`EarthCanvas`) and interaction code (moved verbatim into `useGlobeController`) |
