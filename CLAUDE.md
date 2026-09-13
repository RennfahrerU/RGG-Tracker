# RGG Tracker

No build step, no tests, no framework — plain HTML/CSS/JS static site. Verify changes by opening the file in a browser; there's nothing else to run.

## Architecture

```
site/
  index.html             → landing, lists all games (live + "coming soon")
  shared/
    site.css             → shared design tokens + component styles, all pages link it
    tracker.js           → ES module: localStorage save/load, Export/Import JSON, autosave wiring
    bugreport.js          → self-mounting "report a bug" button + <dialog>, builds a mailto:
                            link client-side (no backend, no third-party form service)
  games/
    <game>/index.html    → one tracker per game, self-contained (own <script type="module">
                            with that game's TROPHIES array + badge logic; imports tracker.js
                            for the generic save/export/import plumbing)
```

Each `games/<game>/index.html` is a hand-built copy, not generated from a template — there is no shared header/nav include. New game page = copy an existing one and edit by hand. The nav always has a `‹ Back to Games` link (not just "Games") back to `../../index.html` — carry that label over, don't revert it to plain "Games".

## Deploy (EC2 + Caddy)

Server: `ec2-user` on the EC2 box. Repo lives at `/var/www/rgg-tracker` (git clone of this repo), Caddy serves the `site/` subfolder:

```caddyfile
rgg-tracker.com {
    root * /var/www/rgg-tracker/site
    file_server
}
```

Deploy = `cd /var/www/rgg-tracker && git pull`. No sudo, no Caddy reload/restart needed (Caddy `file_server` reads from disk per request).

Same box also serves an unrelated site (`romantica-baladas.duckdns.org` → `/var/www/radio`) in the same Caddyfile — don't touch that block.

## Decisiones de dominio (no obvias del código)

- **Checkbox `id` attributes ARE the persistence schema.** `tracker.js` saves/restores state keyed by each input's `id`, and that's also the key format in user-exported/imported JSON backups. Never rename an existing checkbox `id` — it silently orphans that field in anyone's saved progress or exported file (the value just stops being read, no error). Adding new ids is safe.
- **`autocomplete="off"` is mandatory on every checkbox/number input.** Without it, browsers (session restore, bfcache) can re-apply an old checked state on reload/reopen independent of `tracker.js` and `localStorage` — causes a checkbox to appear checked that the user never touched (and can falsely complete a trophy that depends on "all N checked"). Fixed once across all pages; keep it on any new input added later.
- **Internal links (nav, CSS, favicon, cover art, the `tracker.js` import) are root-absolute** (`/`, `/games/kiwami/`, `/shared/site.css`, `/assets/...`) — no `index.html` in any href, no `../../`. This used to be relative-with-`index.html` on purpose, to keep working as a GitHub Pages backup/fork at a subpath (`user.github.io/RGG-Tracker/`); that GH Pages copy was retired 2026-09-10, so the site is now committed to being served from a domain root only. Don't revert to relative paths unless a subpath-hosted mirror is back on the table — ask first.
- **Caddy's systemd unit has `ProtectHome=yes`.** Never point a Caddyfile `root` at anything under `/home/*` — it fails with a bare "not authorized" regardless of chmod/chown, because it's sandboxing at the systemd level, not a file-permission issue. Deploy targets must live under `/var/www` (or similar, outside `/home`).
- **Deploy directory permissions:** owned by `ec2-user`, group `caddy`, with the setgid bit set on every directory (`chmod g+s`). New files pulled by `git pull` inherit the `caddy` group automatically, so Caddy can read them without a manual `chown` after every deploy. Don't undo the setgid bit or the manual-chown chore comes back.
- **GTM container `GTM-5L9F44ZT`** is pasted as a raw snippet into each page's `<head>`/`<body>` individually (no shared include) — a new game page needs both blocks copied in by hand, same as the nav/header markup.
- **`bugreport.js` is the one shared script every page imports without any per-page HTML.** On load it appends a "Report a bug" trigger into that page's `.site-nav-links` (inline in the top nav, next to "Games") and appends its `<dialog>` to `<body>`. It was originally a fixed floating bottom-right button, but that overlapped the Ko-fi donate widget in the same corner — moved into the nav bar instead, so it can't collide with any other floating UI. New game page just needs `<script type="module" src="/shared/bugreport.js"></script>` before `</body>` plus the standard `.site-nav-links` container in its nav (same as the existing pages) — no other markup to copy. The recipient address (`yilver1@protonmail.com`) is hardcoded in that file as `REPORT_EMAIL`; update it there only, once, if it ever changes.
- **DLC trophy lists are excluded from every tracker.** Infinite Wealth's "Master Vacation" DLC and Judgment/Lost Judgment's "Kaito Files"/"Detective Essentials" DLC each have their own separate trophy list on GameFAQs that isn't required for the base-game platinum — don't add their trophies to `TROPHIES`, since the "N remaining" math and platinum unlock assume only base-game trophies count.
- **All 12 games in the series are live** (Yakuza 0/Kiwami/Kiwami 2/3/4/5/6, Like a Dragon, Gaiden, Infinite Wealth, Pirate Yakuza, Judgment, Lost Judgment) — the landing page has no "coming soon" cards left. A next game would need a new GameFAQs guide from CyricZ to exist first.
