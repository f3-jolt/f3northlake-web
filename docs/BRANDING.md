# F3 Northlake — Design Guidelines & Branding

This document describes the design system used by the F3 Northlake website so that
anyone maintaining the site — or any F3 region copying it (see
[ADOPT-THIS-SITE.md](ADOPT-THIS-SITE.md)) — can keep it consistent.

The design follows the shared "family template" used by adjacent DFW regions
(F3 Alliance, F3 NFW, F3 Skynet): **black + salmon red + white**, condensed
all-caps display type, title-case gray section headings, red icon rows, and a
red full-width FNG band.

All design tokens live in one place: the `:root` block at the top of
[`public/css/styles.css`](../public/css/styles.css). Change colors and fonts
there, not scattered through the pages.

---

## 1. Logos

| File | What it is | Usage |
|---|---|---|
| `public/img/logo.png` | The region roundel (F3 Northlake shield) | Header brand mark, favicon, intro section |
| `public/img/f3-logo.png` | The F3 Nation logo (black artwork) | Section icons; always paired with class `invert-dark` so it flips to white in dark mode |
| `public/img/aos/logos/*.png` | Per-AO logos (transparent PNG) | Overlaid centered on each AO card photo |

Rules:

- The region roundel never gets recolored, stretched, or put on a busy background.
- Black line-art logos must carry the `invert-dark` class so they stay visible
  in dark mode (`filter: invert(1)` is applied automatically).
- AO card photos are darkened to 35% brightness (`filter: brightness(0.35)`)
  specifically so the AO logo reads on top. Supply AO logos as transparent PNGs.

## 2. Color

### Brand palette (fixed — same in both themes)

| Token | Hex | Role |
|---|---|---|
| `--red` | `#e93d3d` | Primary accent: buttons, links, icons, active filters, Bootcamp pill, FNG band |
| `--red-dark` | `#cc2929` | Button hover state |
| `--black` | `#000000` | Hero/dark-section backgrounds, "navy" buttons, Ruck pill |
| `--charcoal` | `#111111` | Strong text on light backgrounds |
| `--gray-head` | `#58595b` | Section headings (light theme), Run pill |
| `--gray-body` | `#6d6e71` | Body text (light theme) |
| `--white` | `#ffffff` | Text on red/black |

### Theme tokens (switch between light and dark)

The site is theme-aware. Surfaces and text use **theme tokens**, never raw hex:

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | `#ffffff` | `#161616` | Page background |
| `--bg-alt` | `#f7f7f7` | `#101010` | Alternate section background (`.section.alt`) |
| `--text` | `#6d6e71` | `#ababab` | Body text |
| `--head` | `#58595b` | `#e8e8e8` | Headings |
| `--strong` | `#111111` | `#f0f0f0` | Emphasized text |
| `--card-bg` | `#ffffff` | `#1e1e1e` | Card surfaces |
| `--card-border` | `#e4e4e4` | `#343434` | Card borders |

Rules:

- Red is an **accent**, not a surface. Large red areas are limited to the
  `.cta-band` (FNG band) and buttons.
- New components must use theme tokens (`var(--bg)`, `var(--text)`, …) so they
  work in dark mode without extra rules.
- One caveat when changing the accent color: the inline SVG icons in the HTML
  pages hardcode `#e93d3d` (`fill`/`stroke` attributes). A rebrand requires a
  find-and-replace of `#e93d3d` across `public/*.html` in addition to editing
  `--red`/`--red-dark` in the CSS.

## 3. Typography

Three Google Fonts, loaded in every page `<head>`
(Oswald 400–700, Jost 400–700, Roboto 400/500/700):

| Token | Font | Used for | Style |
|---|---|---|---|
| `--font-cond` | **Oswald** (fallback Arial Narrow) | Nav links, hero headline, buttons, filter pills, pills/labels | ALL CAPS, letter-spaced |
| `--font-head` | **Jost** (fallback Trebuchet MS) | Section headings, card headings, kickers | Title Case |
| `--font-body` | **Roboto** (fallback Helvetica/Arial) | Body copy | Sentence case, 16px / 1.65 line height |

Hierarchy conventions:

- **Hero `h1`**: Oswald, uppercase, very large ("IRON SHARPENS IRON").
- **Kicker** (`.kicker`): small uppercase label above a section title.
- **Section title** (`.section-title`): Jost, gray (`--head`); add `.underline`
  for the short red rule beneath it.
- **Section subtitle** (`.section-sub`): centered intro paragraph under the title.

## 4. Voice & tone

- Written in **F3 lexicon**, with the lexicon term bracketed in navigation:
  "Get Started **[FNG]**", "Find a Workout **[AO]**". Link the word *lexicon*
  to <https://f3nation.com/lexicon> the first time jargon appears on a page.
- Core vocabulary used throughout: FNG, AO, PAX, Q, SLT, COT, post, the gloom,
  first-F/second-F/third-F, HC, mumblechatter.
- Direct, confident, welcoming: "We leave NO man behind so be assured — you
  will survive your FIRST POST."
- The announce bar under the nav is the standing promise:
  `F3 <Region> ✕ Free Workout Groups for Men ✕ No Catch`.
- Always "free, peer-led workouts **for men**" — the five Core Principles
  (free of charge, open to all men, held outdoors, peer led, ends with a COT)
  are F3 Nation canon and must not be edited.

## 5. Layout system

- **Container**: content is centered in `.container`, max-width `1160px`
  (`--max-w`), 24px side padding.
- **Section rhythm**: pages alternate full-width `.section` bands —
  default (white/`--bg`), `.section.alt` (light gray/`--bg-alt`), and
  `.section.dark` (black, white text). Dark sections bookend content for
  contrast; don't stack two dark sections back to back.
- **Page heroes**: the home page uses the tall `.hero` (photo + black overlay);
  interior pages use the shorter `.page-hero` with a per-page banner class
  (`hero-ao`, `hero-slt`, `hero-fng`, …) whose background image is set in the
  CSS (`public/img/banners/*`).
- Mobile: the nav collapses behind a hamburger (`.nav-toggle`); grids collapse
  via `auto-fill, minmax(...)` so no extra breakpoints are needed for cards.

## 6. Components

| Component | Class(es) | Notes |
|---|---|---|
| Primary button | `.btn.btn-red` | Oswald caps; flag glyph prefix (`<span class="flag">⚑</span>`) on "Find a Workout" |
| Secondary button | `.btn.btn-navy` | Black; used on red bands and cards ("Map It", "What to Expect →") |
| Announce bar | `.announce` | One line, under the nav, on every page |
| Core principles row | `.principles` > `.principle` | 5 columns; red inline-SVG icon, Jost heading, one-line description |
| Red CTA band | `.cta-band` | Full-width red; white icon, `[F.N.G.]` heading, black button |
| AO card | `.ao-card` | Photo darkened + AO logo overlay, type pills, schedule list (`.ao-meta`), Map It button |
| AO type pill | `.ao-type.bootcamp/.ruck/.run` | Bootcamp = red, Ruck = black, Run = gray |
| Filters | `.ao-filter` | Two rows: workout type + day of week; active state = red |
| SLT card | `.slt-card` | Photo, role line (`.slt-role`), F3 name in quotes as the `h3`, real name beneath (`.real-name`) |
| News card | `.news-card` | Image, source label, headline, blurb; whole card is a link |
| Video embed | `.video-facade` | YouTube "lite embed": thumbnail + play button; iframe only loads on click |

Icons are **inline SVG**, not an icon font: simple geometric glyphs,
red (`#e93d3d`) on light sections, white on red bands, 64×64 viewBox.

## 7. Theming (dark / light / system)

Every page supports a three-way theme toggle in the header:

- The choice is stored in `localStorage.theme` and applied as
  `<html data-theme="dark|light">`; "system" removes the attribute and defers
  to `prefers-color-scheme`.
- Each page `<head>` includes a tiny inline script **before** the stylesheet
  link that re-applies the saved theme — this prevents a flash of the wrong
  theme. Keep it when creating new pages.
- The toggle markup (three buttons with `data-set-theme`) and its logic in
  `public/js/main.js` must be copied verbatim onto any new page.

## 8. Imagery

- **Style**: real photos from the gloom — dark, early morning, outdoors, candid.
  Photos sit behind black overlays or brightness filters, so contrast-heavy
  shots work best.
- **Hero / banners**: landscape, ≥1600px wide (`img/hero.jpg`,
  `img/banners/*.jpg`). Focal point matters more than resolution — banner crop
  positions are tuned per image in the CSS.
- **AO photos** (`img/aos/*`): landscape, ~800px+ wide; rendered at 175px tall,
  object-fit cover, darkened to 35% with the AO logo centered on top.
- **SLT headshots** (`img/slt/*`): roughly square, face centered, ≥400px.
- Compress everything (JPEG/WebP); this is a static site and images are the
  entire payload.

## 9. Conventions for new pages

1. Copy an existing page (e.g. `resources.html`) — header, announce bar, theme
   script, theme toggle, footer are shared boilerplate and must match.
2. Add the page to the nav **on every page** and to the footer Quick Links.
3. Set a unique `<title>` (`Page Name | F3 Northlake`) and `<meta description>`.
4. Compose the body from existing section patterns before inventing new ones.
5. When editing `styles.css` or `main.js`, bump the cache-busting query string
   (`styles.css?v=NN`, `main.js?v=N`) in **all** pages that reference it.
