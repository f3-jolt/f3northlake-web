# F3 Northlake Website

Static website for the F3 Northlake region, styled to match adjacent DFW regions
(F3 Alliance, F3 NFW, F3 Skynet): black + salmon red palette, bold all-caps Oswald
headings, "Iron Sharpens Iron" hero, five core principles, FNG onboarding, AO
schedule with type/day filters, SLT page, resources page, and dark/light theming.
Plain HTML/CSS/JS — no framework, no build step — deployed on Cloudflare Workers.

## 📋 Copy this site for your region

Other F3 regions are welcome to use this site as a template. Two docs make that
straightforward:

- **[docs/ADOPT-THIS-SITE.md](docs/ADOPT-THIS-SITE.md)** — step-by-step how-to:
  everything to find-and-replace (region name, socials, email), the IDs to
  re-point (F3 Nation map coordinates, PAX Vault region ID, YouTube video),
  images to swap, how AO cards / filters / SLT cards work, and deploying to
  Cloudflare — with a launch checklist at the end.
- **[docs/BRANDING.md](docs/BRANDING.md)** — the design system: color tokens,
  typography, voice & lexicon conventions, layout rhythm, component inventory,
  theming, and imagery guidelines, so edits and new pages stay consistent.

## Structure

```
public/            # Everything served to the browser
  index.html       # Home — hero, intro video, core principles, map, FNG band, news
  fng.html         # Get Started [FNG] — first-post guide + lexicon
  workouts.html    # Find a Workout [AO] — schedule cards with type/day filters + map
  leadership.html  # Shared Leadership Team (SLT) roster
  resources.html   # F3 Nation tools, gear, and links
  disclaimer.html  # Participation disclaimer (placeholder legal copy)
  404.html         # Not-found page
  css/styles.css   # Shared design system (see docs/BRANDING.md)
  js/main.js       # Nav toggle, AO filters, video facade, theme toggle
  img/             # Logo, hero/banners, AO photos + logos, SLT headshots, news
docs/
  BRANDING.md      # Design guidelines & branding
  ADOPT-THIS-SITE.md # How another F3 region can copy this site
wrangler.jsonc     # Cloudflare Workers static-assets config
```

## Local development

```bash
npm install
npm run dev
```

Or without installing anything: `python3 -m http.server 8788 -d public`

## Deploy to Cloudflare

```bash
npm install
npx wrangler login
npm run deploy
```

This deploys as a Cloudflare Worker serving static assets. To attach the custom
domain (e.g. `f3northlake.com`), add it in the Cloudflare dashboard under the
Worker's **Settings → Domains & Routes**.

## Remaining placeholders

- **Disclaimer** — `disclaimer.html` still carries placeholder legal copy;
  have region leadership review/replace it.

## Maintenance notes

- Design tokens (colors, fonts, widths) live in `:root` at the top of
  `public/css/styles.css` — see [docs/BRANDING.md](docs/BRANDING.md).
- When editing `styles.css` or `main.js`, bump the `?v=` cache-busting query
  string on the `<link>`/`<script>` tags in **all** pages.
- New pages must be added to the nav and footer Quick Links on **every** page
  (header/footer are copy-pasted boilerplate, not includes).
