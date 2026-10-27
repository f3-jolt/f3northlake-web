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
  js/workouts.js   # Renders the AO schedule from live F3 Nation API data
  img/             # Logo, hero/banners, AO photos + logos, SLT headshots, news
src/
  worker.js        # Worker: serves assets + /api/* proxy to the F3 Nation API
docs/
  BRANDING.md      # Design guidelines & branding
  ADOPT-THIS-SITE.md # How another F3 region can copy this site
wrangler.jsonc     # Cloudflare Workers config (assets + worker + region vars)
```

## Live schedule data (F3 Nation API)

The workouts page loads its AO schedule from the
[F3 Nation API](https://api.f3nation.com/docs) at runtime:

- `src/worker.js` exposes **`GET /api/workouts`** — it calls
  `GET /v1/map/event/all` filtered to the Northlake region, trims the response
  to the fields the site needs, and caches it at the edge for 15 minutes.
  The API key stays server-side; the browser never sees it.
- `src/worker.js` also exposes **`GET /api/upcoming`** — concrete event
  instances for the next few days from `GET /v1/event-instance` (so
  cancellations, special times, and one-off events are respected), cached for
  5 minutes. Dates are computed in the region's timezone (`F3_TIMEZONE` var,
  default `America/Chicago`). Each instance is enriched with its workout
  types (joined from the weekly series) and the scheduled Q/Co-Qs (from
  `GET /v1/attendance/event-instance/{id}`, fetched in parallel and omitted
  if unavailable).
- `public/js/workouts.js` fetches `/api/workouts`, groups events by AO, and
  rebuilds the schedule cards (days, times, type badges, address, map link).
  It also fetches `/api/upcoming` and fills the "Upcoming Workouts" section
  with the next two days of workouts, hiding instances that already started.
  If the API is unreachable or the key is missing, the static cards already in
  `workouts.html` remain as the fallback and the Upcoming section stays
  hidden — the page never breaks.
- The region org ID (`F3_REGION_ID`, currently `40364`) and the required
  `Client` header value (`F3_API_CLIENT`) are plain vars in `wrangler.jsonc`.
- AO card artwork also comes from the API: both routes join each AO's
  `logoUrl` from `GET /v1/org` (the AO orgs of the region), so logos uploaded
  in the F3 Nation admin appear automatically. On the weekly cards the logo is
  overlaid (screen blend, which drops the artwork's black background) on a
  background photo keyed to the AO's workout type (ruck wins if present) — the
  images in `public/img/types/` (`bootcamp.jpg`, `ruck.jpg`, `run.jpg`,
  `default.jpg`), which can be swapped freely.
- The AO map embed is re-centered at runtime from the region's live location
  coordinates (`locations` in `/api/workouts`, from `GET /v1/location`); the
  hardcoded `lat`/`lon` in the iframe src is only the pre-JS default.
- The static fallback cards in `workouts.html` are a generated snapshot of the
  API data (see the comment in the markup) — regenerate them from the live
  page rather than hand-editing when the schedule changes materially.

### API key setup

Create a **read-only** API key at <https://admin.f3nation.com/api-keys>
(requires region admin), then:

```bash
# Production (Worker secret)
npx wrangler secret put F3_API_KEY
```

```bash
# Local dev — .dev.vars is gitignored
cp .dev.vars.example .dev.vars   # then paste the key into it
```

## Local development

```bash
npm install
npm run dev
```

Or without installing anything: `python3 -m http.server 8788 -d public`
(static pages only — the `/api/*` routes need `npm run dev`, which runs the
Worker; without them the workouts page shows its built-in static schedule).

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
