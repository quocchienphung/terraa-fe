# Footer Specification

## Overview
- **Target file:** `.../root-8a5edab2/Footer.tsx`
- **Screenshot:** `ref-1440-bottom.png`, `ref-390-sec10.png`
- **Interaction model:** hover (link underline grows)

## DOM Structure
`footer[flex col center, gap 10, padding 64px 16px 16px, bg #121212, overflow hidden, relative]` (phone: padding 48px 16px 40px)
- Container[z 1, max-w 1800, width 100%, overflow hidden] > ContentWrapper[flex col, gap 120 (phone 80)]
  - Row[flex, gap 80] (phone: col, gap 80)
    - Wrap-left[flex 1 0 0, max-width 680, flex col gap 16]: h4 (max-width 380; Geist 32/36.8 ls -1.28 #fff; phone 20/23 ls -.8) + form[flex, align flex-end, gap 2]: label > input box `[190×40 (phone flex 1), padding 13, bg rgba(227,227,227,.2), backdrop blur(5px)]` > input (Geist 11/11 ls -.44 #e4e4e4, placeholder "Your email"); button `[84×40 (phone 180×40), padding 12px 24px, bg #fff, radius 2, Geist 11/15.4 ls -.44 #121212]` "Sign Up"
    - Wrap-right[flex 1 0 0, flex col, gap 120 (phone 80)]: Row[flex gap 32] × 2, each with 2 Items[flex 1 0 0, flex col gap 16]: header p (Geist 14/16.8 500 ls -.56 #595959) + Wrap[flex col gap 2] > links `a[flex center, padding 0 2px, overflow hidden, relative]` > Underline `div[absolute bottom 0 left -1px, height 1px, width 1px → hover 100%, bg #fff]` + p (Geist 12/14.4 ls -.48 #fff, line box 16px)
  - Bottom Row[flex, align flex-end, gap 32] (phone: col, align flex-start, gap 32)
    - Logo[300×40, aspect 7.407] img `footer-wordmark.svg` (phone 300×40 too — observed similar)
    - copyright p[flex 1] (Geist 12/14.4 ls -.48 #b8b8b8) "©2026 Anode Energy"
    - legal Wrap[flex 1, flex col]: 3 links (Geist 12/14.4 ls -.48 #fff): Privacy Policy (/privacy), Terms & Conditions (/terms), Cookie Policy (/)
    - right Wrap[flex center gap 16]: "All Rights Reserved." (#b8b8b8) + link "Website by Flowit.Supply" (#b8b8b8, https://flowit.supply)
- BG `div[absolute inset 0, z 0, opacity .5, transform rotate(180deg)]` > img `footer-vector-bg.png` cover (1436×730)

## Geometry @1440
- footer y 8330 h 605; h4 y 8394; form y 8446; columns x 760 / 1108 (316 wide each, gap 32); second row y 8652; bottom row y 8875 h 43; logo x 16 w 300; copyright x 348; legal x 765; right x 1183

## Columns
- Company: Home (/), About (/about), Solutions (/solutions/plp), Projects (/projects), Careers (/careers), Contact (/contact)
- Solutions: Systems (/solutions/systems), Deployment (/solutions/deployment), Software (/solutions/software)
- Media: Newsroom (/news/filters/all), Announcements (/news/filters/announcement), Editorial (/news/filters/editorial), Shareholder Letters (/news/filters/shareholder-letter)
- Social: LinkedIn (https://www.linkedin.com), X (Twitter) (https://x.com)

## Responsive
- Phone (@390): h 857; everything stacks; two link columns per row remain (163px each); bottom row stacks: logo, copyright, legal links, then "All Rights Reserved. / Website by" row.
