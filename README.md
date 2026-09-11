# F3 Northlake Website

Static website for the F3 Northlake region, styled to match adjacent DFW regions
(F3 Alliance, F3 NFW, F3 Skynet): dark navy palette, bold all-caps Oswald headings,
"Iron Sharpens Iron" hero, five core principles, FNG onboarding, AO schedule, and SLT page.

## Structure

```
public/            # Everything served to the browser
  index.html       # Home — hero, 3 F's, core principles, FNG teaser
  fng.html         # Get Started [FNG] — first-post guide + lexicon
  workouts.html    # Find a Workout [AO] — schedule cards + map placeholder
  leadership.html  # Shared Leadership Team (SLT) roster
  disclaimer.html  # Participation disclaimer (placeholder legal copy)
  404.html         # Not-found page
  css/styles.css   # Shared design system
  js/main.js       # Mobile nav toggle
  img/logo.png     # Official F3 Northlake logo (from ~/Documents/F3/Images)
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

## Placeholders to replace before launch

- **Photos** — every dashed `img-placeholder` block (hero background, workout
  photos, AO photos, SLT headshots)
- **SLT headshots** — photos in `leadership.html`
- **Social links** — Facebook/Instagram/X URLs in the footers
- **Disclaimer** — replace placeholder legal copy in `disclaimer.html`
