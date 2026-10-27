# Adopt This Site for Your F3 Region

This site is plain HTML/CSS/JS (no build step, no framework) deployed as a
Cloudflare Worker serving static assets. Any F3 region is welcome to copy it.
This guide walks through everything to replace so it becomes **your** region's
site. Budget 2–4 hours plus photo gathering.

Read [BRANDING.md](BRANDING.md) alongside this — it explains the design system
so your edits stay consistent.

## What you need

- A copy of this repo (fork it, use it as a GitHub template, or download a zip)
- [Node.js](https://nodejs.org) (any recent LTS) — only used to run the
  Cloudflare `wrangler` CLI
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up) for hosting
- A text editor. None of this requires being a programmer — it's find-and-replace
  plus copy-pasting repeating blocks.

Run the site locally at any point to check your work:

```bash
npm install
npm run dev
```

(or, with no install at all: `python3 -m http.server 8788 -d public`, then open
<http://localhost:8788>)

---

## Step 1 — Global find & replace

Do these case-sensitive replacements across **every file in `public/`** plus
`package.json` and `wrangler.jsonc`:

| Find | Replace with | Appears in |
|---|---|---|
| `F3 Northlake` | `F3 YourRegion` | Titles, meta descriptions, nav brand, announce bar, body copy, footers, alt text |
| `Northlake, Texas` | Your town/area | Meta descriptions, footer blurbs |
| `f3northlake-web` | `f3yourregion-web` | `package.json`, `wrangler.jsonc` |
| `contact@f3northlake.com` | Your region email | Footer email link (`href` **and** `title`) on every page |
| `https://www.facebook.com/F3northlake` | Your Facebook URL | Footer on every page |
| `https://www.instagram.com/f3northlake/` | Your Instagram URL | Footer on every page |
| `https://x.com/F3Northlake` | Your X/Twitter URL | Footer on every page |

If you don't have one of the social accounts, delete that whole `<a>…</a>`
block from each footer rather than leaving a dead link.

Sanity check that nothing is left:

```bash
grep -ri northlake public/ package.json wrangler.jsonc
```

(Only hits should be ones you intentionally kept, e.g. a credit — see the
bottom of this guide.)

## Step 2 — Region-specific IDs and embeds

Three external integrations are keyed to the Northlake region and must be
re-pointed at yours:

1. **F3 Nation map embed** (home page, `index.html`):

   ```html
   <iframe src="https://map.f3nation.com/?lat=33.13&lon=-97.19&zoom=11" ...>
   ```

   Go to [map.f3nation.com](https://map.f3nation.com), pan/zoom to your region,
   and copy your latitude/longitude into `lat=` / `lon=` (zoom 10–12 usually
   frames a region well). Update the iframe `title` too.

2. **PAX Stats link** (nav on every page):

   ```html
   <a href="https://pax-vault.f3nation.com/stats/region/40364" ...>PAX Stats</a>
   ```

   `40364` is Northlake's region ID in PAXMate/PAX Vault. Find yours at
   [pax-vault.f3nation.com](https://pax-vault.f3nation.com) (search for your
   region and copy the ID from the URL). If your region isn't on PAX Vault,
   delete the PAX Stats `<li>` from the nav on every page.

3. **YouTube video** (home page "This is F3" section):

   ```html
   <button type="button" class="video-facade" data-video-id="Qbq9AN3wWMc"
           data-video-title="This is F3 Northlake" ...>
     <img src="https://i.ytimg.com/vi/Qbq9AN3wWMc/maxresdefault.jpg" ...>
   ```

   Replace the video ID (`Qbq9AN3wWMc`) in **both** places — the
   `data-video-id` and the thumbnail URL — with your region's intro video. No
   video yet? Use F3 Nation's national intro video, or delete the
   `<div class="video-embed">…</div>` block.

## Step 3 — Logos and photos

Replace the files in `public/img/` **keeping the same filenames** (then nothing
in the HTML/CSS needs to change), or rename and update the references:

| File(s) | What to put there |
|---|---|
| `img/logo.png` | Your region logo (used as header mark **and** favicon) |
| `img/f3-logo.png` | Keep — the F3 Nation logo |
| `img/hero.jpg` | Home hero background — wide gloom photo, ≥1600px |
| `img/principles.jpg` | Banner photo (used by a page-hero variant) |
| `img/banners/fng.jpg`, `workouts.jpg`, `leadership.jpg` | Interior page banner photos |
| `img/types/*.jpg` | One background photo per workout type (bootcamp, ruck, run, default) |
| (AO logos) | Served live from the F3 Nation API (`logoUrl` on each AO org) — upload them at admin.f3nation.com, no local files needed |
| `img/slt/*.jpg` | SLT headshots (square-ish, ≥400px) |
| `img/news/*` | Keep — national F3 press coverage (CBS, Men's Health, NYT) |

Banner crop positions are tuned per image in `public/css/styles.css` (search
for `img/banners`) — if faces or subjects sit awkwardly after swapping a
banner, adjust the `center 40%`-style position values there.

## Step 4 — Your AO schedule (`workouts.html` + the F3 Nation API)

The schedule is live data: `src/worker.js` proxies the F3 Nation API and
`js/workouts.js` renders the AO cards, the Upcoming Workouts section, and the
map center from it. To point it at your region:

1. Set `F3_REGION_ID` (your region org id), `F3_API_CLIENT`, and `F3_TIMEZONE`
   in `wrangler.jsonc`.
2. Create a read-only API key at admin.f3nation.com/api-keys and store it with
   `npx wrangler secret put F3_API_KEY` (and in `.dev.vars` for local dev).
3. Keep your schedule, AOs, and AO logos current in the F3 Nation admin — the
   site reflects them automatically.

The hardcoded `.ao-card` blocks inside `.ao-grid` are only the no-API fallback.
Regenerate them from your live page (copy the rendered grid markup) rather
than hand-writing them.

Notes on how the pieces work:

- **Type pills**: use `<span class="ao-type bootcamp|ruck|run">` (a card can
  have several). Pill colors are styled per type in the CSS; a type without a
  CSS rule (e.g. `30/30`, `blackops`) still works, it just gets the default
  pill background.
- **Filter buttons**: the two `.ao-filters` rows at the top of the page define
  the available type and day filters. The filtering in `public/js/main.js`
  matches a type button's `data-filter` against the card's pill **text**, so
  keep them in sync (e.g. a `data-filter="ruck"` button matches a pill that
  says "Ruck"). Remove filter buttons for types your region doesn't have.
- **Day filtering** parses day abbreviations (`Mon`, `Tue`, …) out of the
  **bold** part of each schedule line — so keep days inside the `<b>…</b>` as
  shown above or day filters won't find them.
- **Map It**: share a Google Maps link for each AO
  (`maps.app.goo.gl/...`).

Also update the map-section iframe at the bottom of `workouts.html` with the
same lat/lon as Step 2.

## Step 5 — Your leadership roster (`leadership.html`)

Each SLT member is one `.slt-card`:

```html
<div class="slt-card">
  <div class="slt-photo"><img src="/img/slt/f3name.jpg" alt="F3Name, F3 YourRegion Nantan" loading="lazy"></div>
  <div class="slt-role">Nantan (Regional Leader)</div>
  <h3>"F3Name"</h3>
  <p class="real-name">Real Name</p>
</div>
```

Duplicate one card per member and update the role, F3 name (in quotes), real
name, and photo. Your role names (Nantan, Weasel Shaker, 1st/2nd/3rd F Qs,
etc.) can be whatever your region uses.

## Step 6 — Remaining copy

- **`fng.html`** — the first-post guide is generic F3 content; read it through
  and localize anything regional (meeting details, what-to-bring, lexicon).
- **`resources.html`** — the link cards point at F3 Nation tools (gear store,
  Slack, lexicon, etc.); keep what applies, add your region's own links.
- **`disclaimer.html`** — placeholder legal copy. **Have your region's
  leadership review it before launch**; it is not legal advice.
- **`index.html` news section** — the three press cards are national F3
  coverage and can stay as-is, or swap in local coverage of your region.

## Step 7 — Optional: change the accent color

The site's red is a design token. To rebrand:

1. In `public/css/styles.css`, edit `--red: #e93d3d` and
   `--red-dark: #cc2929`.
2. The decorative inline SVG icons in the HTML hardcode the hex — run a
   find-and-replace of `#e93d3d` across `public/*.html` too.

Everything else (dark mode, hovers, pills, bands) follows the tokens.
See [BRANDING.md](BRANDING.md) before straying further from the system.

## Step 8 — Deploy

1. In `wrangler.jsonc`, set `name` to your project (e.g. `f3yourregion-web`)
   and **replace `account_id` with your own Cloudflare account ID** (visible in
   the Cloudflare dashboard sidebar, or just delete the line and wrangler will
   prompt you).
2. Then:

   ```bash
   npm install
   npx wrangler login
   npm run deploy
   ```

3. Your site is live at `<name>.<your-subdomain>.workers.dev`. To attach a
   custom domain (e.g. `f3yourregion.com`), add it in the Cloudflare dashboard
   under the Worker's **Settings → Domains & Routes**.

Hosting a static site like this fits comfortably in Cloudflare's free tier.

## Launch checklist

- [ ] `grep -ri northlake public/` returns nothing unintended
- [ ] Logo + favicon replaced (`img/logo.png`)
- [ ] Hero + banner photos replaced
- [ ] Map embed lat/lon updated (home **and** workouts pages)
- [ ] PAX Stats region ID updated (or link removed) — nav on every page
- [ ] YouTube video ID replaced in both places (or embed removed)
- [ ] AO cards match your real schedule; filters match your types
- [ ] Every "Map It" button opens the right location
- [ ] SLT roster + photos updated
- [ ] Social links + email updated in every footer
- [ ] Disclaimer reviewed by your leadership
- [ ] Tested in light **and** dark theme, desktop and phone width
- [ ] `wrangler.jsonc` name + account_id are yours
- [ ] Deployed and custom domain attached

## Questions / credit

This template was built by F3 Northlake (DFW), following the look shared by
F3 Alliance, F3 NFW, and F3 Skynet. Use it freely for your region — a credit
line is appreciated but not required. Questions or improvements: open an issue
or PR on the repo, or reach out at contact@f3northlake.com.
