# dionnawomack.net

Dionna Womack's portfolio. Plain HTML, CSS and JavaScript, no build step.

<<<<<<< HEAD
- `index.html` is the site. Styles in `assets/style.css`, behaviour (including live Elara) in `assets/app.js`.
- `demos/` holds the working projects: `elara/`, `pixelplay/`, `zine-room/`. They load their libraries from `assets/lib/` (not `vendor/`, which many .gitignore templates skip), so nothing depends on outside CDNs.
- Fonts are self-hosted in `fonts/` (Fraunces and DM Sans, SIL Open Font License).
=======
- `index.html` is the site. Styles in `assets/site.css`, behaviour (including live Elara) in `assets/site.js`.
- `demos/` holds the working projects: `elara/`, `pixelplay/`, `zine-room/`. They load their libraries from `vendor/`, so nothing depends on outside CDNs.
- Fonts are self-hosted in `fonts/` (Libre Franklin and Source Serif 4, SIL Open Font License).
>>>>>>> parent of 0e1ebda (Portfolio Update)

## Editing copy
Open `index.html` in any text editor (or right in GitHub with the pencil icon), change the words, commit. The site updates in about a minute.

## Adding pictures
Drop a `.webp` or `.jpg` into `img/`, then copy an existing `<img>` line and change the `src`, `width`, `height` and `alt`.
<<<<<<< HEAD

## Teaching Elara new answers
In `assets/app.js`, find `const intents = [`. Each entry has a pattern (`t`), a mood, and three replies (`r`). Copy one, change the pattern and the replies, save.

## Going live on GitHub Pages with your Canva domain
1. New repository on GitHub, upload everything in this folder.
2. Settings → Pages → Deploy from branch → `main` / root.
3. In Canva's domain DNS settings, add four A records for the root domain: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153, and a CNAME for `www` pointing to `heydionna.github.io`. Remove the old Canva records.
4. Back in Settings → Pages, tick Enforce HTTPS once the domain check passes.

## Your photo
Save a portrait as `img/dionna.webp` (or .jpg and change the src in the About section). Until it exists, a pink "DW" monogram shows in its place automatically. A 4:5 crop works best.

## GIF wall

Each tile in the Tenor section is one `<li class="gif" data-clips="sm_1,sm_2,sm_3">` in `index.html`. The names point at `gifs/<name>.mp4` (the clip) and `gifs/<name>.webp` (its still). To swap a GIF, drop in a new mp4 + webp with the same name, or change the names in `data-clips`. Tiles cycle on their own; tapping skips ahead.

## Ho Ho Ahoy demo

`demos/hohoahoy/` is a portfolio copy of the cruise app with `SYNC_URL` left blank, so it never talks to the real Google Sheet and nothing a visitor types leaves their phone. The service worker is also switched off in this copy so it can't cache old versions of your portfolio. Your live group version stays on Netlify, untouched.

## Cache busting

When you change `assets/style.css` or `assets/app.js`, bump the `?v=12` on their links in `index.html` (to `?v=13` and so on) so returning visitors get the new file.

## Share preview image

When someone shares dionnawomack.net, apps show `img/og-image.jpg` (1200x630, the photo-free card). Apps cache previews, so a change can take a while to show; LinkedIn's Post Inspector (linkedin.com/post-inspector) forces a refresh.
=======
>>>>>>> parent of 0e1ebda (Portfolio Update)
