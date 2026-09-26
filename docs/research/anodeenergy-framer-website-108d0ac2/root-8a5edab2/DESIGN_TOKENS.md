# Design Tokens — anodeenergy.framer.website

All values are computed values from the live site (`getComputedStyle`).

## Fonts (all Google Fonts → `next/font/google`)
| Role | Family | Used for |
|---|---|---|
| Editorial / body | **Geist** 400, 500, 600 | every heading, body copy, labels, buttons |
| Technical mono | **Spline Sans Mono** 400 | eyebrow pill, "01" numbers, CAPABILITIES:, dates, counters, map labels |
| Technical mono 2 | **Fragment Mono** 400 | project card `[ 2025 ]`, `[ MW ]` labels, menu clock |
| Technical mono 3 | **PT Mono** 400 | carousel counter `01 / 04`, menu labels `MENU`, `[ 3 ]` |
| Project card display | **Inter** 400 | project title 48px, metrics 38px, description 15px |
| Quote mark | Georgia, serif | the 160px green “ glyph |
| Map card copy | system `sans-serif` | 15px name / 13px place / 12.5px description (the source component leaves the family unset) |

## Colors
| Token | Value | Use |
|---|---|---|
| --color-background | #ffffff | page |
| --color-foreground | #121212 (rgb 18,18,18) | headings, body |
| --color-ink | #0a0a0a | quote, buttons, dark sweeps, map bg |
| --color-label | #1c1c1c | section labels (What We Do…) |
| --color-muted | #595959 | supporting copy, footer headers |
| --color-muted-2 | #666666 | eyebrow pill text, "01" numbers |
| --color-muted-3 | #8a8a8a | testimonial counter/label |
| --color-muted-4 | #b8b8b8 | footer legal text |
| --color-panel | #f5f5f5 | info panels, CTA boxes, nav menu button, carousel buttons |
| --color-panel-2 | #e6e6e6 | Explore CTA |
| --color-logo-box | #ededed | testimonial logo box |
| --color-border | #e4e4e4 | testimonial rules |
| --color-accent | #00e05c (rgb 0,224,92) | green: dots, buttons, quote mark, active marker |
| --color-accent-soft | #d2f2db (rgb 210,242,219) | capability icon chips |
| --color-dark | #121212 | pre-footer, footer bg |
| --color-card-dark | #1a1a1a | project card base |
| --color-glass | rgba(16,16,16,.42) | glass panels |

## Type scale (desktop → phone)
| Element | Desktop | Phone (≤809) |
|---|---|---|
| Hero h1 | Geist 104/93.6, ls -5.2px, 400 | 48/43.2, ls -1.92px |
| h2 (Our Solutions, Featured Projects) | 72/75.6, ls -2.88px | 32/33.6, ls -1.28px |
| h3 (What We Do, Where We Operate, News, Ready to build) | 48/55.2, ls -2.4px | 32/36.8, ls -1.6px |
| h4 (solution title, footer title) | 32/36.8, ls -1.28px | 20/23, ls -0.8px |
| h5 (hero intro, news title) | 18/22.5, ls -0.72px, 500 | 16/20, ls -0.64px |
| body / label | 14/16.8, ls -0.56px, 500 | same |
| CTA label | 14/14, ls -0.14px, 600 (small: 12/12, ls -0.12px) | same |
| footer link | 12/14.4, ls -0.48px, 400 | same |
| mono small | Spline Sans Mono 10/16, uppercase | same |
| quote | Geist 48/51.84, ls -1.44px | 34/37.4, ls -1.02px |
| menu link | Geist 54/64.8, ls -2.16px | — |

## Spacing
- Page gutter: 32px desktop (hero, what-we-do, solutions heading), 8px list sections, 16px phone.
- Section paddings (desktop): ticker 80/160, what-we-do 32/160, projects 180/100, testimonial 32/160, news 160/160, pre-footer 128/128, footer 64/16/16.
- Section paddings (phone): ticker 80/80, what-we-do 32/80, solutions 80/80, projects 80/80, testimonial 80/80, news 80/80, pre-footer 128/128, footer 48/16/40.
- Container max-width 1800px.

## Radii
- 0 everywhere except: eyebrow pill 861px, icon chips 6px, carousel buttons 8px, project card 32px, glass panel 18px, map card 12px, Sign Up 2px.

## Easings
- `--ease-cta: cubic-bezier(0.22, 0.61, 0.24, 1)`
- `--ease-nav: cubic-bezier(0.16, 1, 0.3, 1)`
