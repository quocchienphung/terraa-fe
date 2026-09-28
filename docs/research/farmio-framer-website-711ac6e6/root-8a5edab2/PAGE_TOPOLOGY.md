# Page topology — `/`

Heights are the reference at 1440×900 (measured). `†` = section retained from the previous site, not part of Farmio.

| # | Section (component) | Anchor | Background | Reference height | Layout |
| --- | --- | --- | --- | --- | --- |
| — | Header (`shared/Header`) | — | white pill, fixed | 128 bar | logo · 5 links (+ Viewroom) · CTA; hamburger below 1200 |
| 1 | Hero (`Hero`) | `#home` | field photo + black 73% | 900 (100vh) | H1 top-left; media card bottom-left; copy + CTA bottom-right |
| 2 † | Logo ticker (`LogoTicker`) | — | white | ≈400 (proposed) | caption pill · logo track · ruler + fixed centre pointer |
| 3 | About (`About`) | `#about` | sand | 656 | tag left / H2 right (636); 4 stats with gradient dividers |
| 4 | Solutions (`Solutions`) | `#our-solutions` | mist | 952 | heading block top-left over a bottom-aligned 3-card row (363/445/712 high) |
| 5 | Services (`Services`) | `#service` | sand + photos | 4500 (5×100vh) | sticky panel at top 40px; 5 crossfading states; list on phones |
| 6 | Features (`Features`) | `#feature-section` | sand | 770 | text + 2 impact stats (599) · photo (673×530) |
| 7 † | Earth (`WorldGlobe`) | `#global-view` | night `#0a0a0a` | min(90vh, 800) | tag + H2 centred; WebGL Earth; pins, card, legend, controls |
| 8 | How it works (`HowItWorks`) | `#how-it-works` | mist | 923 | centred heading; 3 step cards (424×454) |
| 9 | Gallery (`Gallery`) | `#gallery` | sand | 1097 | centred heading; full-bleed 4-column mosaic (360×751 columns) |
| 10 | Team (`Team`) | `#team` | sand | 878 | centred heading; 3 portrait cards with white name card |
| 11 | Testimonials (`Testimonials`) | `#testimonial` | mist | 909 | heading + copy; infinite slideshow; dots |
| 12 | FAQ (`shared/Faq`) | `#faq-section` | white | 1114 | centred heading; accordion (648) + square drone photo |
| 13 | CTA + footer (`shared/CtaFooter`) | — | field photo + black 75% | 846 | "Join us" CTA; white rounded footer card |

`/contact-us`: Header → Contact (tag, H1, copy, phone/email; form card) → FAQ → CTA/footer.
`/viewroom`: Header → mist section (tag, H1, copy; 20px-radius viewer frame) → CTA/footer.

Responsive structure changes (measured):
- Header: desktop links + CTA ≥1200; below that, a 48px pill with hamburger that expands in place (Home, About us, Services, Gallery, Testimonials, Contact Us + Viewroom).
- Solutions: 3 bottom-aligned columns ≥1200; 2-column grid (342×393) at tablet; stacked (274/274/305) on phones.
- Services: sticky crossfade ≥768 (card 655 / 585); plain list <768 (cards 350, image 326×210).
- Testimonial card: row (content 377 + photo 312) ≥768; column (photo on top) on phones.
- FAQ image: stretches to the list height ≥1200; square below it otherwise.
- Footer: row ≥1200; stacked with a 3-column link row at tablet; 2-column link grid on phones.
