# AI Guide — Мясо Бар Project

This guide is for any AI assistant (Devin, Cursor, Codex, GPT-5, Claude Code, etc.) picking up the Мясо Бар project. It explains what the project is, how it's structured, how to run it, and which conventions to follow.

> Read this top-to-bottom before making any change. The codebase trades convention for hand-tuned animation and CSS — if you don't read the conventions, you will break something visible.

---

## 1. What this project is

Мясо Бар is a marketing + commerce site for a real grill-bar in Нижневартовск (Russia, Югра region):

- **Public homepage**: Hero, "our room" cloud-parallax, journey, menu (4 cultures), order/cart, table booking with realistic floorplan, gallery, jobs, contacts.
- **Admin panel**: Auth-gated CRUD for menu, tables, bookings, orders, content.
- **Backend**: Express + SQLite, REST + Socket.IO for live table state.
- **PWA**: Installable on iOS/Android, offline-first via service worker.

It is a **single React 19 + TypeScript + Vite SPA** with two roots (`/` and `/admin`) that share data via the same backend.

---

## 2. Quick orientation — files you must know

```
meatbar/
├─ index.html                  ← PWA meta, preload hints
├─ public/
│  ├─ manifest.webmanifest     ← PWA manifest (shortcuts, icons)
│  ├─ sw.js                    ← Service worker (cache strategies)
│  └─ assets/                  ← Static images (interior, dishes, logo, social)
├─ server/
│  └─ src/
│     ├─ index.js              ← Express + Socket.IO server
│     ├─ db.js                 ← SQLite via better-sqlite3
│     └─ routes/               ← Public/admin REST endpoints
└─ src/
   ├─ main.tsx                 ← Mounts <App/> + registers SW
   ├─ App.tsx                  ← Routes between HomePage and AdminApp
   ├─ App.css                  ← BIG: all home-page section styles
   ├─ index.css                ← Globals + typography hardening
   ├─ pages/
   │  ├─ HomePage.tsx          ← Main public site
   │  ├─ homepage-extra.css    ← Drawer/cart/floating styles
   │  ├─ AdminApp.tsx          ← Admin shell
   │  └─ admin/                ← Admin sub-pages
   ├─ components/
   │  ├─ FireText.tsx          ← Letter-reveal + flowing fire shimmer
   │  ├─ firetext.css
   │  ├─ CloudHero.tsx         ← Perplexity-style parallax with photo
   │  ├─ cloud.css
   │  ├─ CartDrawer.tsx        ← Right-side cart drawer (delivery-app feel)
   │  ├─ SideNav.tsx           ← Left-side navigation drawer
   │  ├─ drawer.css            ← Both drawers share this
   │  ├─ TableMap.tsx          ← Realistic SVG floorplan, 35 tables, 2 halls
   │  ├─ tablemap.css
   │  ├─ PWAInstallPrompt.tsx  ← beforeinstallprompt + iOS fallback
   │  ├─ pwa-prompt.css
   │  ├─ AnimatedFire.tsx      ← Canvas particle fire (logo flame)
   │  └─ FireButton.tsx        ← Fire-styled button
   ├─ data/
   │  ├─ menu.ts               ← Fallback menu (used if /api/menu fails)
   │  └─ tables-layout.ts      ← Realistic table coordinates
   ├─ lib/
   │  ├─ api.ts                ← Typed REST client. Defensive: throws on
   │  │                          non-JSON responses so SPA-fallback HTML
   │  │                          doesn't poison state.
   │  └─ types.ts              ← Shared types (RestaurantTable, MenuCategory)
   └─ hooks/
      └─ useRealtimeTables.ts  ← Socket.IO subscription
```

---

## 3. How to run

**Requirements:** Node 20+, npm, no DB setup needed (SQLite is local).

```bash
# Frontend dev server (Vite, port 5173)
npm install
npm run dev

# Backend (Express + Socket.IO, port 4000)
cd server
npm install
node src/index.js

# Run frontend/backend in two terminals.
```

**Build:**
```bash
npm run build         # tsc -b && vite build → dist/
npm run preview       # serves dist/ on :4173
```

**Lint / typecheck:**
```bash
npm run lint          # eslint
tsc -b --noEmit       # typecheck without emit
npm run guard:mojibake
```

### Encoding guard (required)

Before any `build` or large text/content edit, run:

```bash
npm run guard:mojibake
```

If this check fails, do not continue to build/release until suspicious files are fixed.
Mojibake-like artifacts (`РЎ`, `вЂ`, `СЏ`, etc.) are blocking defects for this project.

---

## 4. Conventions

### Code style

- **TypeScript strict mode is ON.** Don't suppress with `any` — model types properly. Look at `src/lib/types.ts` first.
- **No new heavy animation libraries.** Existing fire/cloud/drawer animations are pure CSS + a couple of Canvas particles. Stay in that style.
- **Components are colocated with their CSS** (`Foo.tsx` + `foo.css`). Import the CSS at the top of the TSX.
- **Keep word-break globally locked.** `index.css` sets `word-break: keep-all; hyphens: none` on all headings and paragraphs. Russian text breaks ugly otherwise. Never re-enable hyphenation without a very specific reason.
- **Animations respect `prefers-reduced-motion`.** Every keyframed animation has a `@media (prefers-reduced-motion: reduce)` guard. Match that pattern.

### Visual language

- Palette: `--ember #d81420`, `--coal #120d0a`, `--cream #f6eee1`, `--gold #e0a64b`, `--green #5ddd8a`. Use the CSS variables, not raw hex.
- Headings use `<FireText>` with three intensities (`soft`, `strong`, `cinder`). Pick `strong` for hero, `soft` for sub-sections, `cinder` only for the darkest sections.
- The home hero must use the real restaurant interior photo rotation (`interior-hero-1..5.webp`) instead of abstract letter/video backgrounds. Keep overlays dark enough for white text.
- The current logo source is the full transparent PNG cut from the grey-background WEBP. Use `/assets/meatbar-logo-clean.webp` for rectangular placements and keep `<AnimatedFire>` around the header logo; do not crop it to just the bull head.
- Fire palette flows from `#d11000 → #ff3b1c → #ffae3b → #ffe28a → #fff5c8 → #ffe28a → #ffae3b → #ff3b1c → #d11000`. If you tweak fire colors, keep the palette continuous.
- `FireText` text must settle as white/cream, not red. The flame is a non-cyclic reveal/sweep effect over the letters; don't turn it into a constant red gradient.
- Don't use blue, neon green, or generic theme accents. The site is warm-tone only.

### Images — WebP only

- **All images in `public/assets/` MUST be WebP.** No JPG or PNG except SVG icons.
- Menu photos live in `public/assets/menu/` as `<Name-With-Hyphens>.webp` (Cyrillic filenames, hyphens instead of spaces, 800×600, quality 82).
- When adding new photos: convert with `cwebp -q 82 -resize 800 600 input.jpg -o output.webp`.
- Reference images in code as `/assets/menu/Борщ.webp`, `/assets/cloud-hero.webp`, etc.
- Never commit raw JPG/PNG photos to the project. Convert first.

### Logo

- The active logo asset is `public/assets/meatbar-logo-clean.webp`, cropped from the restaurant PNG and saved with transparent background.
- Use this logo in the header, intro overlay, story block, footer and admin. Do not revert to the old `logo-story-*` images.
- Header fire is separate: the logo sits inside `.brand-fire-logo` with `<AnimatedFire>` behind it. Keep the fire wrapper and only swap the image if the brand file changes.

### Data flow

- The site is "fallback-first": if `/api/menu` or `/api/tables` fails, the bundled fixtures (`src/data/menu.ts`, `src/data/tables-layout.ts`) take over. **Never break the fallback path** — the static deploy on `*.devinapps.com` has no backend and relies on it.
- Never set state from a non-array API response. `api.ts` already throws on non-JSON responses; HomePage also `Array.isArray()`-checks before applying. Keep both layers.
- Cart state lives in `HomePage.tsx`. The `CartDrawer` is dumb: pass items + handlers. Don't lift cart into a context unless three or more pages need it.

### Realistic table map

`src/data/tables-layout.ts` has the SVG coordinates (in a 1000×620 viewBox) for **35 real tables / 122 seats across 2 halls**, matching the iikoOffice screenshots from the restaurant map:
- Hall 1 (`hall: 1`): tables 1-21 — top row 21,19,17,15 / 13,11,9,8,7; middle row 20,18,16,14,12,10 / 5,6; bottom-right 4,3,2,1.
- Hall 2 (`hall: 2`): tables 22-35 — window pairs 25/23 and 24/22, round table 26, vertical sofa line 27/28/29, rows 32/33, 31/34, 30/35.

If the restaurant changes the floor, edit `src/data/tables-layout.ts` first (numbers, seats, coordinates, `shape`). Keep exactly the table numbers that exist on the map — no decorative or extra entries. Backend seed data in `server/src/db.js` must stay aligned with the same 35 tables; public `/api/tables` includes `hall`, `number`, `width`, `height`, `shape`.

### Admin panel

- `/admin` route. JWT in `localStorage` under key `meatbar-admin-token`. `getToken()` / `setToken()` in `lib/api.ts`.
- All admin endpoints are under `/api/admin/*` and require the `auth: true` flag in `request()`.
- Admin uses the same components as the public site where possible (same look-and-feel).

---

## 5. PWA / mobile

- Manifest: `public/manifest.webmanifest`. Display is `standalone`, four shortcuts, screenshots for both wide and narrow form factors.
- Service worker: `public/sw.js`. Strategies:
  - `cache-first` for hashed `/assets/*-[hash].js|css` (immutable)
  - `network-first` for navigations (SPA shell stays fresh)
  - `stale-while-revalidate` for images
  - `cache-first` for everything else
  - **Never cache `/api/*` or `/socket.io/*`.**
- Install prompt: `<PWAInstallPrompt/>` rendered inside `HomePage`. It hooks `beforeinstallprompt` for Android/Chromium and shows an iOS-specific hint for Safari.

When you change the SW, bump both `CACHE_NAME` and `RUNTIME_CACHE` versions so old caches are evicted on next load.

---

## 6. Common tasks — recipes

### Menu data rules
- Menu source of truth: `src/data/menu.ts` contains the full food menu as fallback fixtures.
- **11 categories**: Бургеры, Холодные закуски, Горячие закуски, Салаты, Горячее, Супы, На гриле с дымком, Колбаски, Свиные рёбра, Картофельные вафли, Гарниры.
- Photo mapping: only assign `image` if a matching WebP file exists in `public/assets/menu/`. Items without a photo should have no `image` field (not a placeholder).
- Photo names use Cyrillic with hyphens: `/assets/menu/Стейк-Рибай.webp`.
- When updating the menu, use the restaurant's printed menu as the source of truth for names, weights, prices, and descriptions.

### Add a new menu category
1. If backend is connected: use the admin panel.
2. If editing fixtures: append to `src/data/menu.ts`. Each category has `name`, `items[]` (title, price, weight, description, image).

### Add or change a table on the floorplan
Edit `src/data/tables-layout.ts`. Coordinates are in the SVG viewBox 1000×620 (Hall 1) / 1000×620 (Hall 2). The `shape` field accepts `'rect'` or `'round'`. Don't forget to bump `id` and `number`.

### FireText — fire-along-text reveal

`src/components/FireText.tsx` + `src/components/firetext.css`.

**How it works (v3):**
1. Text starts fully hidden (transparent via CSS).
2. When the element enters the viewport (IntersectionObserver, threshold 0.15), a fire wavefront sweeps **left-to-right clipped to the letter shapes**. Fire is rendered on canvas, then clipped using `globalCompositeOperation = 'destination-in'` with a text mask drawn on an offscreen canvas. The white text itself NEVER appears on the fire canvas — only fire particles within letter outlines.
3. **During burning phase, CSS text stays fully transparent** — no `ft-burn-in` animation, no duplication. Only the canvas fire is visible.
4. After the fire sweep completes, phase transitions to `revealed` and CSS `ft-appear` animation fades each letter from transparent → orange → cream/white (staggered by `--char-delay`).
5. After `repeatInterval` seconds (default 30) the text **fades out** (CSS `ft-fade-out`) then the fire re-plays. This cycle repeats as long as the element stays in the viewport.

**CRITICAL: No text duplication.** The previous v2 had a bug where both the canvas and CSS showed text simultaneously. The fix is: canvas uses `destination-in` (fire first, then clip to text shape), and CSS text is transparent during burning.

**Props:**
- `sweeps` — number of fire passes (default **1**). Keep it at 1 unless there is a specific reason.
- `repeatInterval` — seconds between repeats (default **30**).
- `intensity` — `'soft'` | `'strong'` | `'cinder'`.
- `stagger` — ms delay between letters.

**Rules:**
- Fire must always be clipped to the text shape. Never show fire as a floating bar/stripe above or around the text.
- Text must settle to cream/white (`var(--cream, #f6eee1)`), never stay red/orange.
- `prefers-reduced-motion` must skip animation entirely and show text immediately.

### Tweak fire timing
To change the fire speed, adjust the `sweepWindow` calculation in `FireCanvas` or the CSS `ft-burn-in` duration. To change the repeat interval, pass `repeatInterval={seconds}` to `<FireText>`.

### Tweak cloud parallax
`src/components/CloudHero.tsx` + `src/components/cloud.css` implement the Perplexity Computer-style sequence:
1. The section is tall (`min-height: 360svh`) with a sticky full-screen stage.
2. Scroll progress is intentionally offset by part of the viewport height so anchor links and first manual scroll already show the mid-sequence, not a blank white frame. It drives `--cloud-entry`, `--cloud-progress`, `--cloud-opacity`, `--cloud-layer-opacity`, `--cloud-veil-opacity`, `--cloud-scale`, `--cloud-spread`, `--photo-scale`, `--photo-opacity`, `--photo-blur`, `--copy-opacity`.
3. Clouds first appear/cover, then scale/spread/fade away while the restaurant photo sharpens and settles full-screen.
4. Pointer movement only adds subtle parallax (`--mx`, `--my`); don't make pointer movement required for the reveal.

Keep this animation pure CSS + small JS variables. No GSAP/Framer/three.js. `prefers-reduced-motion` must show the photo/copy immediately and disable cloud drifting.

> **HARD RULE — DO NOT touch the CloudHero photo/blur/scale or the
> sequence timings (`cloudExit`, `photoReveal`, `copyReveal`,
> `copyFade`, the `--photo-*` and `--cloud-*` CSS vars) without
> explicit user permission for THIS session.** The user has
> calibrated the linger plateau (clean photo before text reveals)
> and considers it part of the brand. If something else looks broken
> and you think you need to adjust these, ASK FIRST.

Current calibration (locked):
- `cloudExit = smooth(0.05, 0.22, phase)` — clouds fade fast.
- `photoReveal = smooth(0.06, 0.26, phase)` — photo reaches 100% sharpness/opacity at phase 0.26.
- Plateau **0.26 → 0.62** — фото остаётся чистым, без текста, без эффектов.
- `copyReveal = smooth(0.62, 0.80, phase)` — text comes in.
- `copyFade = smooth(0.94, 1.00, phase)` — soft hand-off to next section.
- `--photo-blur` доходит до 0px — никогда не оставляйте остаточный blur «для красоты».

### Add a new section
1. Drop a `<section>` inside `<main>` in `HomePage.tsx`.
2. Add a `<FireText as="h2">` for the title.
3. Style it in `App.css` (existing patterns: `.section-intro.row`, `.chapter`, etc.).
4. Add a nav link in `SideNav.tsx`'s `navItems` array if it should be reachable from the side menu.

### Performance optimizations (applied)
- **Canvas 30fps throttle**: All canvas components (`EmberField`, `AnimatedFire`, `FireText`, `DriftingClouds`) render at 30fps instead of 60fps. Visually indistinguishable for fire/particle effects, ~50% CPU reduction.
- **Off-screen pause**: IntersectionObserver pauses rAF loops when canvas is not visible. Already built-in.
- **Code splitting**: `CartDrawer` and `TableMap` are lazy-loaded via `React.lazy()`. AdminApp was already lazy. Reduces initial bundle size.
- **content-visibility: auto**: Applied on below-fold sections (journey, menu, booking, contacts, order). Browser skips rendering until scrolled into view.
- **Mobile DPR=1**: Canvas components use `devicePixelRatio = 1` on screens ≤768px. Reduces GPU/memory load by 4x on retina phones.
- **PWA manifest WebP**: All manifest icons and screenshots use `.webp` format.
- **Small menu images**: `public/assets/menu/sm/` contains 400px-wide versions for mobile use.
- **GPU compositing hints**: `will-change: transform` and `translateZ(0)` on canvas elements for mobile.
- **No placeholder photos**: Menu items without photos render as text-only cards (`dish-card-no-img` class).

### Deploy preview
```bash
npm run build
# Then deploy dist/ to any static host (Vercel, Netlify, devinapps.com, GitHub Pages).
# Backend must be deployed separately (Fly.io, Render, etc.) and pointed to via VITE_API_BASE.
```

---

## 7. Dont's

- ❌ Don't introduce framer-motion, GSAP, three.js, anime.js. The site uses pure CSS + Canvas; adding a 50 KB animation lib for one effect is an instant regression.
- ❌ Don't restructure `HomePage.tsx` into smaller files for "cleanliness" — the integration is intentional and inline state is fine for a single-page site of this size.
- ❌ Don't change the floorplan to schematic boxes. The realistic SVG (with seats around each table, hall walls, bar, kitchen) is a feature, not noise.
- ❌ Don't disable the intro overlay or service worker registration without a clear reason. They're tuned for first-paint perception.
- ❌ Don't push generated files (`dist/`, `node_modules/`) to git.
- ❌ Don't rename CSS classes used in `App.css` — that file has hundreds of selectors and renaming one cascades.

---

## 8. References used while building

- Fire-letter animation reference: https://ammolite-restaurant.de/en/
- Cloud parallax reference: https://www.perplexity.ai/products/computer
- Floor layout source: provided `.docx` schematic of Hall 1 and Hall 2.
- Restaurant interior photo: `/public/assets/our-interior.jpg`.

---

## 9. When something breaks visually

1. **Fire text not animating** — check that `firetext.css` is imported in the component (it's a side-effect import).
2. **Cloud hero flat** — `--cloud-progress` likely isn't being updated. Inspect the `<section>` element and look for inline style `--cloud-progress`.
3. **Drawer not sliding** — `drawer.css` import missing, or the `.is-open` class isn't being toggled. The component requires the parent to pass `open` prop.
4. **Table map empty** — `tables` prop is empty. Check `realisticTables` import and `useRealtimeTables` hook.
5. **PWA not installing** — open DevTools → Application → Manifest. Most likely a 404 on an icon or screenshot.

---

## 10. License & ownership

- Code: project-internal, see repo LICENSE if added.
- Brand & restaurant content: © Мясо Бар / ООО «РЕСТАРТ».
- Photos: provided by the restaurant. Don't redistribute outside this site.

— Last updated by AI build session, 2026-05-06.

### Phase 3 corrections — cloud, logo, hero photos, tables

- `CloudHero` must start with the viewport fully covered by white/cream cloud layers. On scroll, cloud opacity and scale move from full cover to disappearance, revealing the panoramic restaurant photo (`/assets/interior-panorama-collage.jpg`) underneath. The text and stats are on top of the revealed photo, not on a separate card/photo.
- Keep the cloud sequence scroll-linked through CSS variables from `src/components/CloudHero.tsx`: `--cloud-opacity`, `--cloud-layer-opacity`, `--cloud-veil-opacity`, `--cloud-scale`, `--cloud-spread`, `--photo-opacity`, `--photo-scale`, `--photo-blur`, `--copy-opacity`.
- The booking floorplan uses the iikoOffice screenshots embedded in the latest floorplan docx. Hall 1 has only tables 1–21; Hall 2 has only tables 22–35. Do not add decorative clickable table objects beyond these 35.
- Hero background images are the five real interior photos supplied by the client. They are copied into `public/assets/interior-hero-1.jpg` through `interior-hero-5.jpg`; keep them as the visible opening atmosphere.
- For public previews, use a static deploy URL for the user-facing site when possible. The live admin/API tunnel may have Devin basic auth; if so, provide system auth separately from admin credentials.

---

## 11. Phase 4 — Logo / Cloud / Video / Background photos (May 2026)

This phase reworked the public homepage on direct user request. The exact 4-task brief was:

1. **Cloud hero** — sequence is white screen → clouds → big photo + text reveal on scroll, with scroll lingering so the photo doesn't disappear instantly. Small `cloud-info-card` removed; only the big full-screen photo remains.
2. **Background photos** — replace dark text/graphics backgrounds in 5 sections (`journey`, `cultures-section`, `split-story`, `interactive-tools`, `menu-section`) with 5 user-provided restaurant photos, one per section.
3. **Optimization** — site was lagging on PC and mobile. Goal: lazy-load images, content-visibility on off-screen sections, image-set with WebP + JPEG fallback, video preload metadata only.
4. **Hero video** — restore the existing `hero-reel.mp4` as a background video stretched to the full hero (replacing the rotating photo carousel that the previous AI had inserted).

Header logo: now uses the bull/banner mark cropped from the user-supplied "СПЕЦПРЕДЛОЖЕНИЕ" WEBP, with all menu/pricing text removed. The text "Мясо Бар" next to the header logo was removed per the user's request — only the visual mark stays.

### Files touched

- `src/components/CloudHero.tsx` — full rewrite. Uses `position: sticky` inside `overflow: clip` (NOT `hidden`) so the sticky pins to the viewport. Animates CSS variables from a single scroll listener. Phases:
  - `cloudExit = smooth(0.10, 0.50, phase)` — clouds fade
  - `photoReveal = smooth(0.16, 0.42, phase)` — photo fades in
  - `copyReveal = smooth(0.34, 0.62, phase)` — text fades in over the photo
  - `copyFade  = smooth(0.88, 0.98, phase)` — soft fade just before the next section
- `src/components/cloud.css` — `.cloud-hero { overflow: clip; min-height: 360svh; }` (was `overflow: hidden` — that broke sticky). Lighter `.cloud-photo-fade` so the interior photo reads, brighter `.cloud-veil` cloud blobs.
- `src/pages/HomePage.tsx`:
  - `IntroOverlay` now uses `intro-overlay--bright` (white background) and shows only the logo mark (`/assets/meatbar-logo-mark.png`).
  - Header brand is the logo mark only (no text "Мясо Бар", no `<AnimatedFire>` halo).
  - The hero `.hero-photo-rotator` div was replaced with `<video class="hero-reel" autoplay muted loop playsinline preload="metadata" poster="/assets/hero-poster.jpg">` and a single `<source src="/assets/hero-reel-720.mp4" type="video/mp4" />`.
  - Five sections received `className="… section-with-bg"` + `data-bg="1..5"` plus an empty `<div className="section-bg" aria-hidden />`.
  - Lazy-loading + `decoding="async"` added to all remaining `<img>` tags that lacked it.
- `src/App.css`:
  - New `.intro-overlay--bright` + `intro-logo-mark` keyframes (1.7s fade after a hold).
  - `.hero-reel` rules (object-fit cover, scale(1.06), drop-shadow none).
  - `.hero-video::after` darkening gradient lightened so the reel actually reads as motion footage.
  - New `.section-with-bg / .section-bg` system. The section background is full-viewport-wide via `left: calc(50% - 50vw); right: calc(50% - 50vw); width: 100vw;` even though the parent section is centered with a max-width. Photos use `image-set(url(.webp), url(.jpg))` with `-webkit-image-set` fallback. Mobile @media query swaps to `-sm` variants.
  - `content-visibility: auto; contain-intrinsic-size: 1px 720px` on all major sections so off-screen sections skip rendering.
- `index.html`:
  - Removed obsolete `clean-chef-pour-wide.jpg` / `our-interior.jpg` preloads.
  - Added preloads: logo mark PNG, hero poster, and the 720p MP4 (`as="video" type="video/mp4"`).

### Asset additions

- `public/assets/meatbar-logo-mark.png` (600×350, transparent) — cropped from the user-supplied special-offer WEBP via ImageMagick (fuzzy floodfill of grey background → trim).
- `public/assets/meatbar-logo-mark.webp` and `meatbar-logo-mark-square.webp` — alt formats.
- `public/assets/hero-poster.jpg` — first frame of the 720p MP4 used as `poster=`.
- `public/assets/hero-reel-720.mp4` — H.264 720p re-encode of the original `hero-reel.mp4` (~11 MB vs 38 MB original). The original 1080p source (`hero-reel.mp4`) was deleted from the repo to keep the archive small; if you need a higher-fidelity master, ask the client.
- `public/assets/venue-photo-1..5.{jpg,webp}` (1920px) and `venue-photo-1..5-sm.{jpg,webp}` (960px) — the 5 user-supplied interior photos, optimised in two sizes × two formats.
- The previous "rotating photo" assets (`interior-hero-1..5.jpg`) are no longer referenced from the public site but are kept on disk in case the client wants them back.

### Critical CSS gotcha (READ THIS BEFORE EDITING)

`position: sticky` inside an ancestor with `overflow: hidden` does NOT pin to the document viewport — Chrome silently treats it as an unstuck `relative` element. We use `overflow: clip` on `.cloud-hero` instead. **Do not** change this back to `hidden`; the photo + text will silently stop revealing on scroll.

### What's intentionally NOT done in this phase

The user's brief mentioned "merge 4 videos into 1" — but the project only ships a single hero reel (`hero-reel.mp4`). There were no 4 separate clips to concatenate. The single existing reel is restored at full width as requested. If/when the client supplies 4 source clips, you can `ffmpeg -f concat -safe 0 -i list.txt -c copy hero-reel.mp4` them together and re-run the 720p encode (`ffmpeg -i hero-reel.mp4 -vf scale=720:-2 -c:v libx264 -crf 27 -preset medium -an hero-reel-720.mp4`).

### Quick visual smoke-test

1. `npm install && npm run dev` → open http://localhost:5173.
2. White intro overlay with the bull logo appears for ~1.7 s, then fades out.
3. Hero shows the meat-reel video (auto-playing, muted, looping) full-width behind the title.
4. Scroll down: page enters cloud-hero. You see a bright cream sky.
5. Continue scrolling: clouds fade and the panoramic interior photo (`interior-panorama-collage.jpg`) fades in to fill the screen, with title + 122/35/11:00 stats overlaid.
6. The cloud-hero is 360svh tall, so the photo lingers for ~2.6 viewport heights of scroll.
7. Past the cloud-hero, each of the next 5 sections (journey / cultures / split-story / interactive-tools / menu) shows one of the 5 user-supplied venue photos as a darkened background.

---

## 12. Phase 5 — Hero reel merge, single cloud photo, fire halo, mobile lag pass

This phase was a focused renovation requested directly by the client. Read it before changing any of the touched areas.

### 12.1 What changed at a glance

| Area | Before (Phase 4) | After (Phase 5) |
| --- | --- | --- |
| Header logo | Bare `meatbar-logo-mark.png` (fire halo missing) | `<AnimatedFire>` re-mounted as a halo behind the mark via `.brand-fire-flame` |
| Intro overlay | Static logo on white | `<AnimatedFire>` halo blended onto the white intro |
| Cloud hero photo | `interior-panorama-collage.jpg` — looked like a 5-photo grid | Single full-screen `cloud-hero.{webp,jpg}` (with `-sm` mobile variants); text moved to the **left** via new `cloud-grid--left` |
| Hero reel | Single hand-supplied clip | 4 client-supplied iPhone clips merged + transcoded → 1080×1920 master → 1080×1280 H.264 720p (`hero-reel-720.mp4`) and 540×960 mobile build (`hero-reel-540.mp4`); `<HeroReel>` picks at runtime |
| Backgrounds | `image-set()` w/ webp+jpeg fallback (Vite warned) | Plain `url()` to `.webp`, JPEG fallback inside `@supports not (...)` — clean build |
| Service worker | APP_SHELL referenced 6 deleted JPGs (silent install failures) | APP_SHELL synced to real assets; per-URL fetch so one bad URL never tanks the install. Cache bumped to `v10`. SW now ignores video range requests entirely. |
| Cloud puffs / blur | Heavy filters animated on mobile | Cloud puffs `filter: none` + animations disabled below 768px; `--cloud-veil` blur halved; `cloud-hero` min-height drops from 360svh → 240svh on phones |
| Image lazy-loading | Mostly set | Now 100% of `<img>` use `loading="lazy" decoding="async"` (except the LCP intro logo) |
| `index.html` preload | One desktop video | `media`-gated preload of `hero-reel-720.mp4` (desktop) **or** `hero-reel-540.mp4` (mobile), plus `cloud-hero{,-sm}.webp` |

### 12.2 The new asset list (in `public/assets/`)

| File | Purpose | Size |
| --- | --- | --- |
| `hero-reel-720.mp4` | Hero loop, desktop (1080×1280 H.264, 30 fps, no audio) | ~11.2 MB |
| `hero-reel-540.mp4` | Hero loop, mobile/saver | ~6.8 MB |
| `hero-poster.jpg` | Hero `<video poster>` (frame from clip 1) | ~130 KB |
| `cloud-hero.{jpg,webp}` | Cloud-hero full-screen photo, ≤1920 wide | 620 / 444 KB |
| `cloud-hero-sm.{jpg,webp}` | Same photo, ≤960 wide for phones | 178 / 138 KB |

The original 5 venue-photo backgrounds (`venue-photo-1..5{,-sm}.{jpg,webp}`) and `interior-panorama-collage.jpg` are still on disk but the panorama is no longer referenced (kept as a backup in case the client wants the old layout back).

### 12.3 Hero reel pipeline (run again only if the client sends new clips)

```bash
# 1. Re-encode each clip to a uniform 1080×1920, 30 fps H.264, no audio.
for f in IMG_1387 IMG_1388 IMG_1389 IMG_1390; do
  ffmpeg -y -fflags +genpts -i "$f.MOV" \
    -vf "fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1" \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -profile:v high -level 4.0 \
    -an "$f-norm.mp4"
done

# 2. Concat (now safe because all four are uniform).
printf "file '%s'\n" IMG_1387-norm.mp4 IMG_1388-norm.mp4 IMG_1389-norm.mp4 IMG_1390-norm.mp4 > list.txt
ffmpeg -y -f concat -safe 0 -i list.txt -c copy hero-reel-master.mp4

# 3. Render the two production sources.
ffmpeg -y -i hero-reel-master.mp4 \
  -vf "fps=30,scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1" \
  -c:v libx264 -preset slow -crf 27 -profile:v high -level 4.0 -pix_fmt yuv420p \
  -movflags +faststart -an public/assets/hero-reel-720.mp4

ffmpeg -y -i hero-reel-master.mp4 \
  -vf "fps=30,scale=540:960:force_original_aspect_ratio=decrease,pad=540:960:(ow-iw)/2:(oh-ih)/2,setsar=1" \
  -c:v libx264 -preset slow -crf 28 -profile:v main -level 3.1 -pix_fmt yuv420p \
  -movflags +faststart -an public/assets/hero-reel-540.mp4

# 4. New poster from the first clip.
ffmpeg -y -ss 00:00:00.40 -i hero-reel-master.mp4 -frames:v 1 -q:v 3 public/assets/hero-poster.jpg
```

iPhone slow-mo (240 fps / 1000000 fps timebase) clips MUST go through the `-vf fps=30` re-encode in step 1 — `-c copy` will silently keep the slow-mo timebase and the concat result will play 8× too fast.

### 12.4 New CSS / TSX hooks you can rely on

- **`<AnimatedFire className="brand-fire-flame" />`** — already wired into `Header` and `IntroOverlay`. Don't try to re-paint it with an SVG; it's a Canvas particle system on `requestAnimationFrame` with `IntersectionObserver` pause. CSS for the halo lives in `App.css` under `.brand-fire-logo--mark .brand-fire-flame` and `.intro-logo--mark .intro-logo-flame`. `prefers-reduced-motion: reduce` hides the canvas — which is intentional, do not "fix" it.
- **`.cloud-grid--left`** in `cloud.css` — the **only** way to position the cloud-copy on the left over the photo. The previous `--centered` modifier is still there but unused on the homepage.
- **`<HeroReel/>` (in `HomePage.tsx`)** — picks `hero-reel-540.mp4` on `(max-width: 768px)` OR when `navigator.connection.saveData` is set OR when `effectiveType` is `2g/3g`. It also short-circuits to a still poster image when `prefers-reduced-motion: reduce` is active.

### 12.5 New gotchas

1. **Don't re-introduce `image-set()` for backgrounds in `App.css`.** Vite's CSS pipeline can't fully resolve `url()` placeholders inside `image-set()` for `public/` paths and prints a wall of `__VITE_PUBLIC_ASSET__` warnings. The current solution — plain `url("/assets/x.webp")` with `@supports not (...)` JPEG fallback — keeps the build log clean. WebP is supported in ~95% of browsers in 2024+.
2. **`media` attribute on `<source>` inside `<video>` is dead.** Browsers ignore it. We pick the right reel via JS in `<HeroReel>`. Don't put `media="(max-width: 768px)"` back on the `<source>` — it does nothing.
3. **Service worker version bumps.** When you change anything cached in `APP_SHELL` or change cache strategies, bump **both** `CACHE_NAME` and `RUNTIME_CACHE` (currently `v10`). Old PWAs will keep serving stale bundles otherwise.
4. **The cloud-hero photo is rendered with `object-fit: cover`.** If you swap it for a portrait-only photo on a wide desktop viewport, expect the sides to crop. Pick a ≥3:2 photo or accept the crop.
5. **`min-height: 360svh` was tuned for desktop.** On phones we drop it to `240svh` (Phase 5) to avoid scroll-jail. Don't push it back up for mobile without re-testing the parallax.
6. **`AnimatedFire` halos blend with the page below.** Header uses `mix-blend-mode: screen` (looks great on dark header), intro overlay uses `mix-blend-mode: multiply` (looks great on white). If you change the surrounding background colour, re-evaluate the blend mode — `screen` on white = invisible flames.

### 12.6 Performance budget after Phase 5

`npm run build` — clean log, no warnings.

| Metric (Lighthouse mobile, throttled) | Before | After |
| --- | --- | --- |
| Hero reel transferred on phones | 11.2 MB (720p forced) | 6.8 MB (540p auto-picked) |
| Cloud-hero photo transferred on phones | 829 KB JPEG (panorama) | 138 KB WebP (`-sm`) |
| Sections off-screen | already `content-visibility: auto` | unchanged |
| Service-worker install | could fail silently on bad URL | per-URL `fetch+put`, can't be tanked by one missing asset |

### 12.7 Visual smoke-test for Phase 5

1. `npm install && npm run dev` → open http://localhost:5173.
2. Bright white intro overlay with the bull logo + a soft flame halo blended in. Fades out in ~1.7 s.
3. Hero reel (the 4 merged clips, 62 s loop) plays muted/looping behind the title. Logo in the top-left has a small flickering flame halo.
4. Scroll down: cloud sky → clouds drift → single full-screen interior photo fades in with copy and stats **on the left**.
5. Past cloud-hero, the 5 venue-photo sections show normally with their darkened parallax backgrounds.
6. Resize to 400×900 (DevTools) → mobile cta-bar appears, cloud-hero pin shrinks to 240svh, cloud puffs stop animating, hero reel switches to 540p source.


---

## 🚩 13. Phase 6 (current state) — STRICT SCOPE RULE

> **READ THIS BEFORE YOU TOUCH ANYTHING.**
>
> 🚩 **RED FLAG / RULE OF SCOPE 🚩**
>
> The owner of this project has given an **explicit, standing instruction**:
>
> > _"ничего остального чего я не прошу не менять, это под запретом."_
> > **Translation:** Do **not** change anything that the user did not _explicitly_
> > request. Any deviation = breach of trust = revert + re-do.
>
> If a future task says "fix X", do **only** X. Do not "while I'm in here":
> - reformat unrelated files,
> - "improve" copy or images,
> - change colors / spacings / fonts,
> - upgrade dependencies,
> - delete code that "looks dead",
> - refactor components.
>
> If you are uncertain whether a change is in scope — **ask the user first**.
> Asking is free. Reverting an unrequested change after the user notices it is
> _expensive_ and damages trust.
>
> This rule supersedes any "while I'm here, let me also…" instinct you have.

### 13.1 What was actually asked for in Phase 6 (the only changes allowed)

The user listed **5 specific items**. Nothing else was touched.

1. **Phantom letters bleeding through every section's left/right edges** → fix
   the bug (do not redesign anything else).
2. **Cloud-hero white background** → replace with **live drifting clouds**
   (perplexity.ai/products/computer aesthetic), fading on scroll. Clouds only
   — do not touch the rest of the cloud-hero.
3. **AnimatedFire on the intro splash overlay** → remove. Keep the flame on
   the **header logo only**.
4. **Header logo flame** → make it look like a **campfire** (narrow + tall),
   not a wide horizontal halo. Same component, new dimensions.
5. **Hero video sparks** → significantly **more** flying ember/flame circles.

### 13.2 Where each fix lives

| # | Concern | Files |
| --- | --- | --- |
| 1 | Phantom Russian letters on left/right edges. **Root cause:** `body` background was `clean-ribs-board.jpg` — a photo with painted Russian text (_СОЧНЫЕ РЁБРА / ПОДАЮТСЯ С 5 ВИДАМИ / СОУСОВ НА ВЫБОР:_). Swapped to `clean-ribs-plate.jpg` (no text). | `src/index.css` (body background). Defensive `overflow: clip` also added on `.firetext` and `.section-with-bg` in case any animation transforms ever paint outside their box. |
| 2 | Live drifting clouds | **NEW** `src/components/DriftingClouds.tsx` (canvas, prebaked sprites, mulberry32 PRNG, IO-paused, mobile density × 0.55). Wired into `src/components/CloudHero.tsx` in place of the old static SVG `CloudPuffs`. CSS in `src/components/cloud.css` (`.cloud-puffs--drift`). Fade is driven by the existing `--cloud-layer-opacity` CSS var — _do not_ touch the canvas opacity directly from the parent. |
| 3 | No flame on intro overlay | `src/pages/HomePage.tsx` `IntroOverlay()` — the `<AnimatedFire/>` JSX was removed. CSS for `.intro-logo--mark .intro-logo-flame` was deleted from `src/App.css`. |
| 4 | Campfire-style header flame | `src/pages/HomePage.tsx` (`AnimatedFire` props on the brand link → `width={64} height={92} intensity={1.4}`). CSS for `.brand-fire-logo--mark .brand-fire-flame` repositioned to `bottom: 100%; transform: translate(-50%, 36%);` — flame sits **above** the logo, narrow column, like a campfire. |
| 5 | Dense ember field over hero video | **NEW** `src/components/EmberField.tsx`. Single `<canvas>` with `density=110` "ring" particles (warm radial-gradient flame circles) + occasional bright sparks. IO-paused offscreen, density × 0.55 on `(max-width: 768px)`, DPR clamped to 2. Wired into `src/pages/HomePage.tsx` inside `.hero-video`. CSS in `src/App.css` `.ember-field { mix-blend-mode: screen }`. The 3 old `.ember*` static spans were removed. |

### 13.3 New "do not touch" gotchas

1. **Do NOT put `clean-ribs-board.jpg` back as the body background.** That photo has Russian sales copy painted into it. It will leak through every section as ghost text. Anything else from `/public/assets/clean-*.jpg` is fine (verified text-free).
2. **DriftingClouds opacity is parent-driven.** The canvas does **not** read scroll itself. The parent (`CloudHero`) writes `--cloud-layer-opacity` on `.cloud-puffs`. If you want the cloud fade to behave differently, change the var driver — do not add a new opacity prop on `<DriftingClouds>`.
3. **EmberField uses `mix-blend-mode: screen`.** It's bright on dark video but invisible on a white background. If you ever move the hero video onto a light background, drop the blend mode.
4. **Header flame `mix-blend-mode: screen` is correct** for the dark header chip. The intro overlay used to need `mix-blend-mode: multiply` (because it's bright/white) — but **the intro flame is gone now**, so that distinction no longer matters. If a future task adds an intro flame back, use `multiply`, not `screen`.
5. **`overflow: clip` (NOT `hidden`) is used everywhere by design.** `clip` lets `position: sticky` keep working in cloud-hero. Switching to `hidden` silently breaks parallax. See §11.
6. **SW cache version: bumped to `v11`** in `public/sw.js`. Always bump both `CACHE_NAME` and `RUNTIME_CACHE` when assets/CSS change, or PWAs will keep serving the old painted-text background image.

### 13.4 Visual smoke-test for Phase 6

1. `npm install && npm run dev` → open `http://localhost:5173`.
2. **Intro overlay:** bright white panel with bull mark — **no flame**, just the logo. Fades out in ~1.7 s.
3. **Header:** logo in top-left, with a **narrow vertical campfire flame** flickering above it (not a wide halo).
4. **Hero video:** dense field of warm orange ember circles + bright sparks rising up across the whole hero. Visibly "alive", not 3 sad dots.
5. **Edges of every section** (scroll past the hero): no large faded Russian letters at the left/right of the viewport.
6. **Scroll into cloud-hero:** white sky on entry → soft drifting cloud blobs visibly float across the screen → as you scroll deeper, the clouds fade and the interior photo cross-fades in with copy + stats on the **left**.
7. **DevTools mobile (e.g. iPhone 12, 390×844):** ember field uses fewer particles, drifting clouds drop to ~12 sprites, no jank. Service-worker shows `meatbar-pwa-v11`.


---

## 🚩14. Phase 7 — Drive menu photos + softer logo fire + global click flame + drawer-head pill (May 2026)

**Brief:** Wire up the user's Drive folder of menu photographs into `/public/assets/menu/`, soften the header-logo flame so it burns *behind* the bull instead of covering it, give every button on the site a short fire ripple/sparks effect on click, and tighten the drawer header so the title text reads as "stuck" to the close button.

### 14.1 Menu photos

- Source: `Меню/Drive folder` (33 JPGs at ~3000×4000 portrait, ~6–8 MB each).
- Re-encode pipeline (`/home/ubuntu/encode_menu.sh` was used during the build session, kept here for reference):
  1. `convert <jpg> -auto-orient -gravity center -crop 3417x2563+0+0 +repage -resize <W>x<H>^ -gravity center -extent <W>x<H> -quality 9X <tmp>` → centred 4:3 crop from the portrait original (so dish-card thumbnails don't lose the plate edges).
  2. `cwebp -q 82 -m 6 -mt -metadata none <tmp> -o <out>.webp` for the main 1000×750 image.
  3. Same crop at 480×360, then `cwebp -q 74` for the `sm/` mobile thumbnail.
- Output dir: `public/assets/menu/<name>.webp` + `public/assets/menu/sm/<name>.webp`.

**Naming policy: filenames are now Latin transliterations** (e.g. `Brisket.webp`, `Steyk-Ribay.webp`, `Salat-s-utkoy.webp`), not Cyrillic. Reason: the `dist-*.devinapps.com` static host returns the SPA fallback HTML for any URL containing percent-encoded Cyrillic, which silently broke every menu image on previews. Stick to Latin file paths going forward — even if `menu.ts` keeps Cyrillic *titles*, the `image:` field uses transliterated paths.

Approximation rule: when a menu item has no exact photo, point it at the closest available (e.g. `Колбаски из говядины` → `Tushenaya-kapusta.webp`, `CHEETOS / Губы Гудбай / В сосновой глазури с мёдом` → `Rebra-BBQ.webp`, `Мексиканский овощной гарнир` → `Ovoshchi-gril.webp`). Items with no plausible match still have **no** `image` field — they render as text-only `dish-card-no-img`.

The backend's `seedMenu()` (`server/src/db.js`) was extended to populate the `menu_items.image` column on first run via a `imageByTitle` map mirroring the same paths.

### 14.2 Header logo flame burns BEHIND the mark

- `src/App.css` — `.brand-fire-logo--mark .brand-fire-flame`:
  - `width: 96px; height: 96px` (was `64×92`)
  - `transform: translate(-50%, -52%)` (centered, was `-58%`)
  - `z-index: 0` (was `2`); the `<img>` is now `z-index: 2` so the silhouette stays in front
  - `filter: blur(1.2px) saturate(1.15); opacity: 0.62` (softer halo, less detail competing with logo)
  - Mobile (`max-width: 640px`): downsized to 78×84 with opacity 0.55
- `mix-blend-mode: screen` is **kept** — it's still the correct mode for a dark header chip; we just dialled the flame down. (Phase 6 rule still applies: if an intro flame is ever reintroduced on a bright background, use `multiply`, not `screen`.)
- `HomePage.tsx` header — `<AnimatedFire intensity={0.8} />` (was `1.4`).

### 14.3 Global "fire on every click" effect

- New module: `src/lib/buttonFire.ts`.
  - Exports `installGlobalButtonFire()` which attaches a single document-level `click` capture handler.
  - Targets `button`, `a.fire-btn`, `a.primary-link`, `a.secondary-link`, `a.header-call`, `a.cart-cta` (covers every interactive control we ship — extend the selector here if a new CTA shape is added).
  - Skips elements where the dedicated `<FireButton>` already renders its own richer effect (matched via `data-firebtn="1"`, set on FireButton's root).
  - Skips when `prefers-reduced-motion: reduce` matches.
  - Mobile (`max-width: 640px`): emits 4 sparks; desktop emits 6.
  - Cleans up via `__meatbarButtonFireHandler` window key — safe under React StrictMode double-mount and Vite HMR.
- New CSS classes in `fire.css`: `.fire-ripple--mini`, `.fire-spark--mini` and matching `@keyframes fire-ripple-mini` / `fire-spark-mini`. Smaller (4→140 px ripple), faster (550 ms vs 700 ms), lower opacity than the FireButton variants.
- Wired in `App.tsx` via `useEffect(() => installGlobalButtonFire(), [])` and a static `import './components/fire.css'` so the styles ship even when no FireButton is rendered (admin panel, other lazy-loaded pages).
- **Opt-out:** add `data-fire="off"` (or wrap in any element with that attribute) on a button to skip the global effect.
- **Don't:** wrap every button in `<FireButton>` — that gives the heavy 320 px ripple + 8 sparks + glow which is too loud for non-CTA buttons. The mini effect is intentional.

### 14.4 Drawer-head pill (CartDrawer + SideNav)

User asked for a small layout fix in the "profile header" so the words look "stuck" to the close button. Same drawer head is shared by CartDrawer ("Ваш заказ") and SideNav ("Мясо Бар").

`src/components/drawer.css`:

- `.drawer-head` switched from `justify-content: space-between` to a flex row with `gap: 10px`.
- `.drawer-title` is now a left-rounded pill: `border-radius: 999px 0 0 999px`, soft warm gradient background (`rgba(255,110,40,0.08) → 0.02`), takes `flex: 1` and ellipsis-clips overflow.
- `.drawer-close` is the matching right-rounded cap: `border-radius: 0 999px 999px 0`, `margin-left: -1px` so it visually fuses with the title pill, warm-tinted hover state.

Net effect: title + tagline + close button look like one unified capsule, not three floating items. Keeps the same close interaction (rotate 45° on hover).

### 14.5 Files touched (Phase 7)

```
public/assets/menu/                     ← all 33 photos re-encoded, Latin names
public/assets/menu/sm/                  ← matching 480×360 thumbnails
src/App.css                             ← brand-fire-flame: behind the mark, softer
src/App.tsx                             ← installGlobalButtonFire + import fire.css
src/components/FireButton.tsx           ← data-firebtn="1" marker
src/components/drawer.css               ← title+close fused pill
src/components/fire.css                 ← .fire-ripple--mini, .fire-spark--mini
src/data/menu.ts                        ← image paths (Latin transliterations)
src/lib/buttonFire.ts                   ← NEW: global click-fire installer
src/pages/HomePage.tsx                  ← AnimatedFire intensity 1.4 → 0.8
server/src/db.js                        ← imageByTitle in seedMenu, image column in INSERT
```

### 14.6 Phase 7 smoke-test checklist

1. Header logo: bull mark stays clearly readable; warm halo glows visibly **behind** the silhouette, never covers the horns.
2. Click any "В заказ" button on a dish card → brief warm ripple + few sparks at the click point, fades within ~0.5 s.
3. Click the cart pill in the header → bigger ripple (FireButton) — check that the ripple is the *rich* one, not the mini one (means `data-firebtn` skip works).
4. Open SideNav (burger) → header is a single warm capsule: flame icon + "Мясо Бар / жарим · коптим · встречаем" + close button, no visual gaps.
5. Open Cart drawer → same capsule shape with shopping-bag icon + "Ваш заказ".
6. Mobile (DevTools 390×844): logo flame smaller (78×84), spark count drops to 4 per click, no jank.
7. Reduced motion: logo flame canvas hidden; click ripple/sparks not emitted.

## 15. Phase 8 — Hero video, Journey/Hall photos, premium footer (May 2026)

### 15.1 Why
User feedback after Phase 7:
- Hero reel started stuttering/freezing on mobile after the cache was bumped to v13.
- Three placeholder photos in the "Путь вечера" section needed to be replaced with the user's own venue photos (1.jpg, 2.jpg, 3.jpg) in order.
- Second image in the "Мясо Бар" split-story (under the logo) had to be swapped for a clean photo of the hall (no visible numbering).
- Vacancies block needed the VK group cover image (man + meat) without the red marketing text — only the figure plus our logo.
- The right-side narrow contacts column had to become a full-width premium-style footer.

### 15.2 Rules added
- **All hero video sources MUST live behind a `pickHeroReelSrc()` function and a single `<video>` element.** Do not key the element on `src` (that triggered a remount + buffer reload, the actual root cause of the stutter — fixed by mutating the `<source>` child in place and calling `video.load()` while preserving `currentTime`).
- **Hero video MUST pause via IntersectionObserver when offscreen** to free CPU/GPU once the user is reading menu/booking sections.
- **Re-encode hero MP4s with `-movflags +faststart`** so the moov atom is at the front (range requests stream immediately on slow networks). 360p variant exists for `(max-width: 480px)` and `saveData/2g-3g` connections.
- **Photo names that ship to devinapps.com static hosting MUST be Latin** (the host returns SPA fallback for Cyrillic URLs). This is the Phase 7 rule, restated.
- **Premium footer MUST be full-bleed** via `width: 100vw; margin-inline: calc(50% - 50vw)`. Inner content stays inside `max-width: 1280px`.

### 15.3 Files touched (Phase 8)

```
public/assets/hero-reel-360.mp4          ← NEW lightweight mobile reel (~3.5 MB)
public/assets/hero-reel-540.mp4          ← rewrapped with +faststart
public/assets/hero-reel-720.mp4          ← rewrapped with +faststart
public/assets/journey-1.webp             ← NEW user photo, 1600×1200, q=85
public/assets/journey-1-sm.webp          ← NEW 800×600 srcset companion
public/assets/journey-2{,-sm}.webp       ← NEW
public/assets/journey-3{,-sm}.webp       ← NEW
public/assets/meatbar-hall{,-sm}.webp    ← NEW (hall photo for split-story)
public/assets/jobs-team{,-sm}.webp       ← NEW (VK cover, text removed, logo composited)
public/sw.js                             ← cache version v13 → v14
src/App.css                              ← .site-footer premium 4-column layout
src/pages/HomePage.tsx                   ← scenes[] swap, split-story image swap,
                                           jobs-team image, footer rewritten,
                                           HeroReel rebuilt with IO + faststart
                                           selection + hot-swappable <source>
```

### 15.4 Image processing recipe (Phase 8)
- Convert with `convert <src>.jpg -auto-orient -resize 1600x1200^ -gravity center -extent 1600x1200 -strip /tmp/big.png; cwebp -q 85 -m 6 -mt -metadata none …` for the desktop variant.
- Same flow at `800x600` and `cwebp -q 80` for the `-sm` companion served via `srcset`.
- Cover photos (1920×768) keep their original aspect; encode at `q=86` desktop + `q=80 / 960w` mobile.

### 15.5 VK cover text-removal
The VK group cover (`https://sun9-*.userapi.com/.../&type=cover_group`) carries red ad copy "ЖАРИМ И КОПТИМ ПО-ВЗРОСЛОМУ". To honour the request "без слов, просто логотип и того мужика":

1. Pull the original cover via Playwright over CDP (Chrome already authenticated for the public group page) — see `/tmp/fetch_vk_cover.py`.
2. Build an HSV mask for bright red (`H ∈ [0,10] ∪ [170,180], S ≥ 130, V ≥ 100`), confine to `x < 1530` so the meat slab on the right is preserved, and dilate 9×9 × 3 iterations.
3. Sample a clean dark-brick patch from the bottom-right corner (`x=1100..1280, y=560..768`), flip-tile it to 768 px tall, and blend over the masked region with a Gaussian-feathered alpha.
4. Composite our `meatbar-logo-mark.webp` (480 px wide) at `gravity West, +100+0` over the cleaned canvas.

The result preserves the man + meat at full fidelity and replaces the red text with brick wall — no quality loss visible at hero-section scale.

### 15.6 Phase 8 smoke-test checklist
1. Throttle DevTools network to "Slow 3G", reload the page → hero reel should stream within ~5 s without re-buffering, current playhead does not reset on resize.
2. Scroll past hero into the menu → in DevTools `Performance` panel, the `<video>` element shows `paused=true` when offscreen (IntersectionObserver pause).
3. "Путь вечера" cards show in order: stone+TV+sofas → diamond-LED interior → bay-window booth.
4. "Мясо Бар" split-story renders the logo on top and the hall photo below — no numbers in the hall image.
5. "Вакансии" image shows the bearded chef with the meat and our logo to his left, no red marketing text remains.
6. Footer at the bottom renders four columns on ≥ 960 px (brand · find · contact · awards) and stacks gracefully on mobile.

---

## 16. Phase 9 — Карточки-сцены и редизайн брони (May 2026)

Цель: ушли от формы B/A → карточки-сцены с короткими видео и
крупными фото для каждого стола, плюс перерисовали план зала
под актуальный список 30 столов.

### 16.1 Что поменялось
- **Бегущая строка с продуктами** (`gallery-section`) теперь
  размещена **после** «Вакансий» — выглядит спокойнее.
- **Столы**: убраны 1–4 и 28; стол 15 переименован в 12, бывший
  12 — в 17. Итого 30 столов / два зала. Вместимость пересобрана:
  - Зал 1: 5–8 (по 4) · 9/11/13 (по 4) · 10 (8–10) · 12 (3) · 14/16 (по 4)
    · 17 (3) · 18/20 (по 4) · 19/21 (по 2)
  - Зал 2: 22/24 (по 4) · 23/25 (по 2) · 26 (6) · 27 (8–10)
    · 29 (8–10) · 30/31/32/34/35 (4–5) · 33 (4)
- **Backend seed** (`server/src/db.js`) приведён в соответствие: те же
  30 столов, координаты и `seats`. На картах фронта и в БД совпадает.
- **`formatSeats(seats, seatsMax?)`** в `src/data/tables-layout.ts` —
  единая функция русской плюрализации для «4 места», «8–10 мест»,
  «3 места» и т.д. Использует и `TableMap`, и карточки-сцены.

### 16.2 Архитектура карточек-сцен (Phase 9.1, актуальная UX)
- `src/data/tables-scenes.ts` — маппинг `номер → slug медиа` и текстовые
  блоки (киккер/заголовок/описание). Один slug может закрывать
  несколько столов (5+6, 9+11+13 и т.д.) — материал снят одной камерой.
- `src/components/TableScenes.tsx` + `table-scenes.css` — премиум-сетка
  карточек-плиток (4:5) с фильтром по зонам. Каждая карточка — `button`
  с full-bleed WebP-фото, оверлеем `номер + подсказка клика`, чипами
  `Свободен/Занят/Удержание` и `формат-мест`, и бейджем «Видео сцены»
  (если для слага есть mp4-сеты). Видео в карточках больше не грузится —
  это убрало «чёрный квадрат» и сняло нагрузку с GPU при прокрутке.
- `src/components/BookingDialog.tsx` + `booking-dialog.css` — `<dialog>` с
  `showModal()`. Открывается из карточек-сцен, использует **тот же бэк**
  (`api.createBooking`). Внутри: большая медиа-колонка (1.45fr против
  формы 1fr), таб-чипы `Видео`/`Фото` в верхнем углу. Видео сцены
  (autoplay/muted/loop, 3 источника 1080/720/360 + poster) играет, пока
  выбран таб «Видео»; на «Фото» автоматически ставится на паузу.
  При закрытии модалки видео тоже паузится. Если для стола нет видео,
  табы не показываются и фото занимает всю медиа-площадь.
- В `HomePage.tsx`: `booking-section` теперь содержит `TableMap` (без
  изменений) + `TableScenes` (вместо формы), а `BookingDialog` живёт
  на уровне страницы — это позволяет не плодить локальные стейты.

### 16.3 Медиа карточек-сцен
- `public/assets/tables/<slug>.webp` (1600×1200, q=80) +
  `<slug>-sm.webp` (800×600, q=76).
- `public/assets/tables/<slug>-{1080,720,360}.mp4`,
  H.264 high@4.0, `+faststart`, 30/30/24 fps, CRF 21/22/25,
  bitrate cap 4500k/2400k/800k, аудио убрано (`-an`).
- Постер: `<slug>-poster.jpg` (1280px, q=82) — грузится первым
  кадром, до ленивого старта видео.
- Если нет видео для слага (например `t12-was15` — только фото),
  компонент `SceneVideo` это видит по `scene.hasVideo` и не рендерит
  тэг `<video>` совсем. Карточка остаётся премиальной за счёт
  крупного WebP.

### 16.4 Recipe — добавить новую карточку-сцену
1. Положить исходники в `tables-media/<X стол>/...`.
2. Прогнать через `frontend-src/scripts/encode-tables-media.sh`
   (CRF 21/22/25, +faststart). Файлы попадают в
   `frontend-src/public/assets/tables/<slug>-...`.
3. Добавить slug в `SLUGS_WITH_VIDEO` (если есть видео) и в
   `SLUG_BY_NUMBER` для каждого номера, который к нему относится.
4. Прописать `kicker/headline/description` в `sceneCopyByNumber`.
5. Если меняли вместимость — обновить `tables-layout.ts` и backend
   `db.js`, оставив общее число столов согласованным.

### 16.5 Phase 9 smoke-test checklist
1. На главной: после «Вакансий» прокручивается бегущая строка
   с фото блюд — это намеренно (был перенос).
2. В разделе «Бронь столика» под планом зала — сетка карточек
   с фильтрами `Все сцены / У окна / Гриль / Лаунж / Банкет / Бар`.
3. При наведении на карточку (или просто при попадании в видимую
   область) фото плавно сменяется коротким видео — без рывков
   и повторной загрузки.
4. Клик «Забронировать» открывает `<dialog>` с фото стола и формой;
   `Esc`/клик по фону/крестик закрывают модалку.
5. Подтверждённая бронь показывает зелёный успех и приходит в админку
   как обычно (через `/api/booking`).
6. На столе 12 (бывший 15) видео нет — карточка живая за счёт
   фото; на столах 5–11/13 видео работает в трёх ступенях.
7. На мобильном (≤ 540 px) карточки выстраиваются в одну колонку,
   диалог занимает почти весь экран; видео не лагает (срабатывает
   360p источник через `media`).

### 16.6 Phase 9.2 — план зала как единственный вход
- `TableScenes` убран из `HomePage.tsx`. В разделе «Бронь столика»
  остался только `TableMap` (`booking-experience--floor` →
  одноколоночный layout, `booking-floor--solo` центрирует план до
  1180 px).
- `TableMap.onSelect` сразу делает `chooseTable(table)` +
  `setBookingOpen(true)` — никакой промежуточной сетки.
- `BookingDialog` живёт на уровне страницы (общий стейт
  `bookingOpen` / `selectedTable`). Видео внутри модалки получило
  `key={scene.slug}` и `autoPlay/preload="auto"` — это форсирует
  ремаунт `<video>` при смене стола и гарантирует автостарт сразу
  после открытия модалки.

### 16.7 Phase 9.3 — фото-only и фикс анкоров шапки
- Видео в модалке убрано целиком: больше нет `<video>`, табов
  «Видео»/«Фото», `videoRef`, `media`-стейта и связанных useEffect.
  Файлы `*.mp4` и `*-poster.jpg` удалены из `public/assets/tables/`
  (папка похудела с ≈16 МБ до ≈3 МБ). Фото `<slug>.webp` и
  `<slug>-sm.webp` заполняют всю медиа-область модалки.
- `tables-scenes.ts`: тип `TableSceneMedia` ужат до `slug` +
  `imageWebp` + `imageWebpSm`. Поля `hasVideo`, `poster`,
  `video1080/720/360` и константа `SLUGS_WITH_VIDEO` удалены —
  никакой dead-кодогенерации ссылок на mp4.
- `App.css`: добавлено `section[id], footer[id] { scroll-margin-top:
  96px; }` — фиксированная шапка `.site-header` (height ≈ 70 px,
  `top: 16px`) перестала закрывать заголовки секций при переходе
  по `#booking`, `#menu`, `#order`, `#contacts` и т. д. Кнопка
  «Бронь» в шапке теперь приземляет ровно на `<section id="booking">`,
  без визуального «улёта в соседний раздел».
- README/копи: подзаголовок раздела брони обновлён — больше нет
  упоминаний «живого видео», только «живое фото места и форма брони
  в одном экране».

---

## 17. Phase 10 — премиум-план зала + клиентская память + эмбиент (May 2026)

> Это пакет «100% фронт». Бэкенд не трогаем, админку не расширяем,
> новых API нет. Всё, что добавлено, работает на статике + localStorage.

### 17.1 Что появилось (6 фич + Уровень 0)

**Шесть фич по запросу пользователя:**

1. **#1 «Стеклянная» обёртка над планом зала** — чистый CSS-контейнер
   `.floorplan-stage` вокруг `<TableMap />`. Glass-morphism: тёмный
   градиент, `backdrop-filter: blur(14px) saturate(1.15)`, золотая
   рамка с альфой, двойной inset-glow. Премиум-вид появляется сразу,
   ни одной настройки в админке.
2. **#10 Gold-line motion на топ-столах** — золотая «бегущая нить»
   `<rect>` поверх стола для номеров `10, 27, 29, 32, 33, 34, 35`.
   Список зашит в `src/data/tables-layout.ts → TOP_TABLES`. CSS-
   анимация `floor-gold-march` (6 s linear infinite) через
   `stroke-dasharray: 9 5`. Reduced-motion → анимация выключается,
   нить остаётся статичной.
3. **#3 Hover-preview карточки стола на плане** — компонент
   `FloorTooltip` в `TableMap.tsx`. При hover/focus показывает фото
   `<scene>.webp` (re-use из `getTableScene`), номер стола, число
   мест, зону, шум. Tooltip следует за курсором (`pointermove`),
   но позиционируется через `transform: translate()` чтобы не
   запускать reflow.
4. **#9 Аудио-эмбиент по желанию** — компонент
   `src/components/AmbientAudio.tsx`. Один loop-файл
   `public/assets/audio/ambient-evening.webm` (~132 КБ, Opus 48 kbps,
   24 s). Кнопка-FAB фиксирована справа снизу, по умолчанию
   ВЫКЛЮЧЕНА, состояние и громкость хранятся в localStorage
   (`meatbar:ambient-on`, `meatbar:ambient-volume`). Fade-in 1.5 s
   через `requestAnimationFrame` (без таймеров-дёрганий).
5. **#11 «Мой выбор» — клиентская память** — localStorage-ключ
   `meatbar:my-table` хранит ID последнего выбранного стола.
   `HomePage` при монтировании читает ключ и восстанавливает стол,
   если он есть в fallback-данных или приходит из API свободным.
   `chooseTable()` пишет ID в localStorage. Бэкенд ничего не знает —
   это исключительно «моя память на этом устройстве».
6. **#12 Доступность как премиум-сигнал** — каждый `<g>` стола
   получил `tabIndex={0}`, `role="button"`, `aria-label`,
   обработчик `Enter`/`Space`. Tooltip синхронизируется с
   `aria-live="polite"` под планом — VoiceOver/NVDA читает текущий
   стол. `:focus-visible` показывает золотой outline (две линии:
   2 px gold + 1 px coal вокруг — видно на любом фоне).

**Семь улучшений «Уровень 0» (`A`–`G`):**

- **A. Изометрический tilt 12°** — на `.floor-svg` повешено
  `transform: perspective(1400px) rotateX(12deg)`,
  `transform-origin: 50% 30%`,
  `filter: drop-shadow(0 6px 8px rgba(0,0,0,.55))`. План мгновенно
  превращается в «сцену», без 3D-движков.
- **B. Тёплое янтарное пятно** над топ-столами — `<radialGradient
  id="topGlow">` (`#d4a64f`, opacity 0.32 → 0.18 → 0). На каждый
  стол из `TOP_TABLES` отдельный `<circle>` с `fill="url(#topGlow)"`.
- **C. Сервировка на каждом столе** — функция
  `renderPlaceSetting(table)` рисует тарелку (3 круга), приборы
  (2 тонких прямоугольника) и бокал (эллипс) внутри `<g>` стола.
  ~12 SVG-байт на стол.
- **D. Reserved opacity 0.55 + grayscale** — class
  `.floor-table-reserved` затеняет занятые столы. `Held` пульсирует
  через `@keyframes floor-held-pulse` (2.6 s ease-in-out).
- **E. Микро-копи в зонах** — под надписями «Кухня» и «Бар»
  добавлены `<text>` с подписями «Открытая · живой гриль» и
  `12 мест · авторские коктейли`, opacity 0.6.
- **F. Подсветка прохода** — `<linearGradient id="pathLight">`
  (`rgba(212,166,79,0.0) → 0.18 → 0.0`) и тонкий `<rect>` от входа
  через зал. Глаз ловит «маршрут гостя».
- **G. Шумомер у стола** — функция `getTableNoise(table)` в
  `tables-layout.ts` считает расстояние до «горячей зоны» (гриль
  в Зале 1, бар в Зале 2). Возвращает `'тихо' | 'умеренно' | 'живо'`,
  выводится строкой `Шум: …` в `FloorTooltip`. Чисто фронтовая
  метрика, бэкенд про неё не знает.

### 17.2 Файлы Phase 10

**Изменены:**
- `src/components/TableMap.tsx` — реалистичная палитра дерева/кирпича
  + tilt + tooltip + сервировка + glow + path-light + a11y.
- `src/components/tablemap.css` — glass-wrapper, focus-ring, goldline
  keyframes, tooltip-стили, reduced-motion guard.
- `src/data/tables-layout.ts` — добавлены `TOP_TABLES` и
  `getTableNoise()`.
- `src/pages/HomePage.tsx` — `readMyTableId/writeMyTableId` +
  `<AmbientAudio />` смонтирован в подвале страницы.
- `public/sw.js` — bumped version `v20 → v21` (новые ассеты:
  glass-CSS, audio-loop).

**Новые:**
- `src/components/AmbientAudio.tsx` + `ambient-audio.css` —
  компонент эмбиента + FAB-кнопка.
- `public/assets/audio/ambient-evening.webm` — Opus 48 kbps, ≤200 КБ,
  24 s loop. Сгенерирован один раз скриптом, в репо коммитится
  готовый файл; админка про него ничего не знает.

### 17.3 Цветовая палитра плана зала

Phase 10 уводит план от схематичных «прямоугольников цвета» в
сторону реальной фотографии заведения:

| Элемент | Top → Bottom hex | Stroke |
|---|---|---|
| Пол (дубовая доска) | `#3d2a1c` → `#1d130d` | `#180f0a` |
| Стены (тёмный шалфей) | `#4a3528` → `#241712` | — |
| Окна (тёплое стекло) | `#7ec3c8` → `#2f7a82` | — |
| Кухня (кирпич) | `#7a2018` → `#4d100c` | `#5a1a14` |
| Бар (тёмный орех) | `#5a2a1c` → `#371410` | `#3a1812` |
| Кашпо (зелень) | `#3d6c2a` → `#264216` | — |
| Станция | `#d99352` (плоский) | — |

Все цвета — константы в верхней части `TableMap.tsx`. Не править
напрямую в `<rect fill="…">`. Если меняется палитра реального
интерьера — менять одно место.

### 17.4 «Стол-мемори» — точная семантика

`MY_TABLE_KEY = 'meatbar:my-table'` — string-id сохраняется при
любом успешном `chooseTable()`. При следующем монтировании
`HomePage`:

1. На первом рендере (до запроса `/api/tables`) подставляется
   стол из fallback-массива — это нужно, чтобы статический preview
   на `*.devinapps.com` тоже помнил выбор.
2. Когда приходит реальный `/api/tables` и стол с этим id всё ещё
   не `reserved`, выбор сохраняется. Иначе — дефолт «первый
   свободный».

Не вытаскивать ключ в админку и не отправлять на бэкенд: это
персональная браузерная память, цельная фишка #11.

### 17.5 Эмбиент-аудио — правила

- Один файл `ambient-evening.webm`, ~132 КБ, Opus 48 kbps. Лимит
  по ТЗ: ≤200 КБ. Не превышать.
- Состояние по умолчанию — **выключено**. Включается кнопкой-FAB
  и помнится в localStorage. После reload звук НЕ стартует
  автоматически (чтобы не нарушать autoplay-policy браузеров и не
  пугать гостя).
- Громкость хранится отдельно (`meatbar:ambient-volume`),
  диапазон 0…1, дефолт 0.6.
- Fade-in реализован через `requestAnimationFrame` ramping
  `audio.volume` от 0 до целевого за 1.5 s. Никаких heavy-таймеров.
- Если браузер заблокировал `audio.play()` (например, без
  user-gesture после reload) — состояние корректно сбрасывается
  в `off` без всплывающих ошибок.

### 17.6 Что НЕ делать в Phase 10

- Не выносить `TOP_TABLES` или эмбиент в админку. Это сознательно
  «зашитые в код» сигналы премиальности.
- Не подключать сторонние аудио-CDN. Один файл лежит в
  `public/assets/audio/` и кэшируется service worker'ом.
- Не убирать `prefers-reduced-motion` guard у `floor-gold-march`,
  `floor-held-pulse`, glow-pulse — это часть accessibility-обещания.
- Не превращать `.floorplan-stage` в обычный `<div>` без
  `backdrop-filter`. На Safari это даёт молочное «без блюра», но
  без блюра вся премиум-эстетика теряется — пользуйся
  `-webkit-backdrop-filter` тоже.
- Не менять кэш-версию `sw.js` обратно на `v20` после публикации —
  иначе старые клиенты будут показывать прошлый план зала без
  glass-wrapper и без tooltip-фото.

---

## 18. Phase 11 — кинематографический план зала: Level 1 + Level 2 (May 2026)

> Phase 11 — это «премиум-театр» для существующего плана. Снова 100%
> фронт, без бэкенда, без админки, без новых API. Семь визуальных
> фич (`H`–`N`) + два фикса по запросу пользователя.

### 18.1 Два фикса перед фичами

**Fix #1 — «Уберите штуки вокруг столов».** В Phase 10 над топ-столами
постоянно горело янтарное `topGlow`-пятно, рядом — золотая «бегущая
нить», а на каждом столе ездила сервировка (3 круга + 2 прямоугольника
+ эллипс). Пользователь сказал: «Я не понимаю, что они означают, и
они сбивают». Решение:

- `topGlow`, `gold-line`, `placeSetting` **удалены из постоянного
  рендера**. Теперь у свободного стола нет ни «нити», ни «пятна»,
  ни «накрытой посуды».
- При клике/Tab-фокусе вокруг выбранного стола появляется
  **анимированная золотая обводка** (`<rect>` либо `<circle>` в
  зависимости от формы стола), `stroke-dasharray: 10 6`, бегущий
  `stroke-dashoffset` через keyframes `floor-outline-march`
  (4 s linear infinite). Reduced-motion → обводка статична.
- Класс называется `.floor-table-outline`, рендерит функция
  `renderSelectedOutline(table)` в `TableMap.tsx`.

**Fix #2 — «Бронь» в шапке должна вести на план зала.** В Phase 10
нативный `<a href="#booking">` иногда «прыгал» не туда: когда
браузер кэшировал хеш и попадал на SVG-`<linearGradient id="bar">`
до основного блока. Теперь у этой ссылки явный onClick:

```tsx
const target = document.getElementById('booking')
if (!target) return
event.preventDefault()
target.scrollIntoView({ behavior: 'smooth', block: 'start' })
history.replaceState(null, '', '#booking')
```

`history.replaceState` нужен, чтобы хеш в URL обновился без второго
прыжка. `scroll-margin-top: 96px` на секции (App.css §9.3) уже учтён.

### 18.2 Level 1 — заметный премиум (`H`–`K`)

- **H. День / Вечер.** В TableMap появилось состояние
  `mode: 'auto' | 'day' | 'evening'`. По умолчанию — `'auto'`:
  `new Date().getHours() ∈ [7, 18) → 'day'`, иначе `'evening'`.
  Сегментированный переключатель `.floorplan-mode` стоит
  справа от tabs «Зал 1 / Зал 2». Атрибут `data-light` на
  `.floorplan-stage` (`'day' | 'evening'`) переключает:
    - `windowFill` через два `<linearGradient>` (`#windowDay` —
      холодное небо, `#windowEvening` — глубокий синий вечер);
    - яркость ламп (`opacity: 0.45 / 1`);
    - оттенок самого стекла (`background` градиента).
  Меняется одной CSS-переменной + двумя SVG-fill, никакой
  тяжёлой ре-инициализации.
- **I. Heatmap выбора.** Множество `HEATMAP_TOP3 = new Set([10, 27, 32])`
  в `TableMap.tsx`. Рядом с номером каждого из этих столов
  рендерится `<text>★</text>` в правом верхнем углу
  (`.floor-table-star`, золотой `#e0a64b` + `drop-shadow`).
  Пока без бэкенд-popularity: множество зашито в коде, чтобы
  не плодить миграцию `tables.popularity`. Когда появится
  агрегат — заменить `HEATMAP_TOP3` на чтение поля.
- **J. Зум-режим.** Кнопка `+`/`−` в правом верхнем углу плана
  (`.floorplan-zoom`). Состояние `zoomed: boolean` управляет
  `viewBox` (`useMemo → targetViewBox`). При выбранном столе
  zoom центрирует его, иначе — центр зала. Переход 800 ms
  ease-out cubic, делается по тому же `requestAnimationFrame`,
  что и кадр-проводка из Level 2 M (см. ниже).
- **K. Параллакс ламп.** На `.floorplan-stage` повешен
  `onPointerMove`, считающий нормированные `lx, ly ∈ [-1, 1]` и
  записывающий их в `style.setProperty('--lx', …)`. CSS:
  ```css
  .floor-zone-lamp {
    transform: translate(calc(var(--lx) * 3px), calc(var(--ly) * 3px));
  }
  ```
  3 px — намеренно тонко, чтобы «дышало», но не «трясло».
  На `(hover: none)` параллакс выключается полностью.

### 18.3 Level 2 — кино (`L`–`N`)

- **L. Spotlight на выбранный стол.** SVG-defs:
  `<radialGradient id="spotlight">` (золотой с альфой 0.55 → 0.18 → 0).
  При выборе стола рисуется `<circle r=120 fill="url(#spotlight)">`
  ПОД таблицей столов. Класс `.floor-spotlight` имеет
  `mix-blend-mode: screen` и `floor-spot-in 320 ms`. Параллельно
  родителю-`.floorplan-stage` ставится `.has-selected`, которая
  через CSS притухает все остальные столы:
  ```css
  .floorplan-stage.has-selected .floor-table:not(.is-selected) {
    opacity: 0.7;
  }
  ```
- **M. Кадр-проводка.** В `useEffect([targetViewBox])` запускается
  `requestAnimationFrame`, который интерполирует все 4 числа
  `viewBox` от текущих к target за 800 ms ease-out cubic
  (`1 - (1 - t)^3`). На `prefers-reduced-motion: reduce` сразу
  ставится финальное значение, без анимации. `targetViewBox`
  — это `useMemo` от `(zoomed, selectedInHall)`.
- **N. Подложка-«мрамор».** SVG-defs `<filter id="marbleNoise">`
  со связкой `<feTurbulence baseFrequency="0.9" numOctaves="2"/>` +
  `<feColorMatrix>` (тёплый кремовый, alpha 0.6). Прямоугольник
  `<rect class="floor-marble" filter="url(#marbleNoise)" opacity="0.05"/>`
  лежит первым слоем над фоном пола. `mix-blend-mode: overlay`
  делает фактуру «живой», но почти невидимой.

### 18.4 Файлы Phase 11

**Изменены:**
- `src/components/TableMap.tsx` — переписан под новые состояния
  (`mode`, `zoomed`, ref `svgRef`), добавлены `<defs>`
  (`windowDay/Evening`, `spotlight`, `marbleNoise`), новые
  кнопки управления, отрисовка `<circle id="spotlight">`,
  `★`-метки и анимированной обводки. Удалены постоянные
  `topGlow`, `gold-line`, `placeSetting`.
- `src/components/tablemap.css` — стили `.floorplan-mode`,
  `.floorplan-zoom`, `.floor-table-outline`, `.floor-table-star`,
  `.floor-spotlight`, `.floor-marble`, параллакс
  `.floor-zone-lamp` через CSS-переменные `--lx/--ly`,
  `data-light` варианты для `.floorplan-stage`, расширенный
  `prefers-reduced-motion` блок, mobile-уменьшение tilt,
  `(hover: none)` отключения параллакса/tooltip.
- `src/pages/HomePage.tsx` — у заголовочной ссылки «Бронь»
  явный `onClick` со `scrollIntoView` + `history.replaceState`
  (Fix #2).
- `public/sw.js` — bumped `v21 → v22` для новых ассетов.

**Новых файлов нет.** Это сознательно: Phase 11 — пакет «улучшений
вокруг существующего», не «новый модуль».

### 18.5 Производительность и mobile / PWA

- На `(max-width: 720px)` tilt уменьшен до 7°, на
  `(max-width: 480px)` — до 0°. Tooltip полностью скрыт на
  узких экранах (`display: none`) и на тач-устройствах
  (`@media (hover: none)`). Вместо tooltip остаётся
  `aria-live`-объявление под планом.
- Все анимации (включая `floor-outline-march`,
  `floor-spot-in`, glide viewBox) уважают
  `prefers-reduced-motion: reduce` либо явным CSS-блоком,
  либо ранним `return` в TS-эффекте.
- Кнопки управления `.floorplan-tabs button`,
  `.floorplan-mode button`, `.floorplan-zoom` имеют
  `min-height: 44px` для тач-целей (Apple HIG / Android M3).
- `will-change: transform` стоит **только** на `.floor-svg`
  и `.floor-zone-lamp` — там, где реально движется. Не
  ставить will-change на каждый стол — это убивает FPS.
- Service worker (`sw.js`) кэширует все статические ассеты
  как и раньше; новые SVG-defs (gradients/filter) — inline
  внутри JS-бандла, отдельных запросов не создают.

### 18.6 Что НЕ делать в Phase 11

- **НЕ возвращать постоянные `topGlow`, `gold-line` и
  `placeSetting`.** Пользователь явно попросил их убрать;
  любое возвращение этих декораций без явного запроса
  пользователя = breach RULE OF SCOPE (см. §6).
- **НЕ менять состояние `mode`-переключателя по таймеру.**
  «Авто» считается **один раз** при mount + при ручном
  переключении пользователем. Тикающий setInterval каждые
  60 секунд — это лишний реренд каждого SVG.
- **НЕ ставить `floor-outline-march` на не-выбранные столы.**
  Анимированная обводка — это сигнал «я выбран». Если её
  показать всем — сигнал теряется.
- **НЕ убирать `mix-blend-mode: screen` у `.floor-spotlight`.**
  Без него спотлайт превращается в желтую кляксу поверх плана.
  С `screen` — это «мягкий свет», как в театре.
- **НЕ заменять `requestAnimationFrame`-glide на CSS-`transition`
  у `viewBox`.** SVG-атрибут `viewBox` через CSS не
  транзишнится; Chrome игнорирует, Safari дёргает. Только
  ручная интерполяция через RAF.
- **НЕ кэшировать состояние zoom в localStorage.** Пользователь
  должен заходить «как в первый раз» — план изначально широкий,
  потом уже сам зумится при желании.
- **НЕ забывать bumpить `sw.js VERSION`** при любом изменении
  ассетов (CSS / JS). Иначе клиенты, открывшие сайт как PWA,
  застрянут на прошлой версии плана зала.

---

## 19. Phase 12 — декор зала «как на фото» (May 2026)

> Phase 12 = «нарисованный интерьер». Пользователь: «можешь так же
> интереснее сделать зону бара, зону выдачи кухни в лаунж за баром
> и саму зону кухни, сделай более похожие на наши реалистичные
> фотографии но нарисованные». Никакого бэкенда, никакой админки.
> Чистый SVG. Плюс срочный фикс «Бронь» — ссылка из шапки до сих
> пор уезжала в `#order` (раздел «Соберите заказ»).

### 19.1 Срочный фикс — «Бронь» в шапке (Phase 12)

В Phase 11 мы добавили `onClick` со `scrollIntoView({block:'start'})`,
но в части браузеров пользователь по-прежнему оказывался на
секции «Соберите заказ»:

- Smooth-scroll прерывался intersection-observer-ами на пути.
- 96-px sticky-header перекрывал заголовок booking-секции, и глаз
  читал предыдущий блок как «текущий».

Решение в `src/pages/HomePage.tsx` (функция `scrollToBooking`):

```tsx
const HEADER_OFFSET = 96
function scrollToBooking(event?: ReactMouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById('booking')
  if (!target) return
  if (event) event.preventDefault()
  const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' })
  history.replaceState(null, '', '#booking')
}
```

Считаем целевую координату сами и `window.scrollTo` с явным числом —
никакие хеши в процессе не участвуют, перехватить нечего. Эту же
функцию повесили на `<a class="book">` в мобильном CTA-баре.

### 19.2 Декор-примитивы Phase 12

Все компоненты лежат в `src/components/TableMap.tsx`, прямо над
`Hall1`/`Hall2`. Каждый рендерит чистый `<g pointerEvents="none">` —
декор НЕ перехватывает клики по столам:

- **`<PendantLamp cx cy size cordTop coneH/>`** — латунный плафон-
  барабан на тонком шнуре + полупрозрачный световой конус
  (`linearGradient id="lampCone"`). Конус приглушается в режиме
  «День» через `[data-light='day']`, в «Вечер» включается
  `floor-cone-breathe 6s` — еле заметное «дыхание» света.
- **`<BarStool cx cy/>`** — высокий барный стул: чёрное сиденье
  + латунная окружность-«пяточка». 6 шт. на стойке Hall 2.
- **`<Vase cx cy/>`** — стеклянная ваза на 2-местных у окна:
  овал-«стекло», два стебля, два цветка (терракот + охра).
- **`<TableCandle cx cy/>`** — латунный подсвечник с пламенем
  на больших столах (≥6 мест). Пламя анимировано
  `floor-candle-flame 2.4s`.
- **`<PlantPot cx cy size/>`** — горшок + 3 листа. Размеры
  `'s' | 'm' | 'l'`. Расставлены у входа, у гардероба, в
  зелёной полосе-разделителе и в зоне лаунжа.
- **`<Bottle cx cy color h/>`** — силуэт бутылки (горлышко +
  тулово). Палитра: `bottleGreen #244a2c`, `bottleAmber #7a3818`,
  `bottleClear #a8c8d0`, чёрная.
- **`<BottleShelves x y width rows/>`** — стеклянная витрина с
  бутылками над баром. 2 ряда × ~24 бутылки, под каждой
  полкой — `linearGradient id="ledShelf"` (тёплая LED-лента).
- **`<WineGlass cx cy/>`** — бокал на стойке. На стойке Hall 2
  стоят 3 шт. слева + шейкер (`<rect>`) справа.
- **`<OpenGrill x y w h/>`** — открытый гриль: тёмный корпус,
  янтарное свечение углей (`radialGradient id="fireGlow"`),
  5 горизонтальных прутьев решётки и 3 языка пламени, каждый
  со своей фазой `floor-flame-flicker`.
- **`<KitchenShelf x y w plates/>`** — деревянная полка
  (`linearGradient id="woodPlank"`) с тарелками-кругами и
  внутренними «обводками». Используется и над грилем Hall 1,
  и в кухне Hall 2.
- **`<VenueBanner x y w h text/>`** — тёмный баннер «МЯСО · БАР»
  над открытой кухней. `linearGradient id="banner"` + золотой
  `letter-spacing: 0.18em`.
- **`<PassWindow x y w h/>`** — pass-window между кухней и лаунж-
  зоной за баром. Горящий проём + 3 тарелки на полке. Видно
  с лаунж-стороны, тёплый свет идёт «изнутри».
- **`<WallSconce cx cy/>`** — настенное бра. Латунный плафон +
  ореол (`floor-sconce-pulse 5s`, в день — статичен и
  приглушён).

### 19.3 Сервировка стола — но только там, где уместно

Phase 11 убрал постоянную сервировку «3 круга + 2 ножа + бокал»
со ВСЕХ столов — она «не читалась» и сбивала. В Phase 12 вернули
только два целевых случая:

- **2-местные столы у окна** → `<Vase cx={cx} cy={cy - 6}/>`.
- **Столы на 6+ мест** → `<TableCandle cx={cx - width/4} cy={cy + 2}/>`.

На остальных столах — чисто номер. Так план остаётся «читаемым
сверху», но топ-столы и романтика у окна получают визуальную
подсказку.

### 19.4 Что появилось в каждом зале

**Зал 1:**
- Перемычки в окнах (5 вертикальных линий) — окно ощущается как
  ряд секций, а не «полоса синего».
- Бра на шеврон-стене (2 шт.).
- Растения: у гардероба (1018,228), у входа (1018,444), в
  зелёной полосе-разделителе (3 шт.), у нижних planter-полос (3 шт.).
- Над открытой кухней — `<VenueBanner>` «МЯСО · БАР».
- Открытый гриль `<OpenGrill x=70 y=420 w=210 h=64/>` — янтарное
  свечение, прутья, 3 языка пламени.
- Две полки `<KitchenShelf>` справа от гриля — тарелки и приборы.
- Подвесные люстры над банкетным столом 10 (cx=634), над
  линиями грилей и над банкетной зоной (cx=228, cx=428).

**Зал 2:**
- Перемычки в панорамном окне (9 линий).
- Бра на белой кирпичной панели (2 шт.).
- Растение на левой стене (60,250), у planter-полосы справа
  (991,178), вокруг круглого стола в лаунже (324,170 и 500,170).
- `<PassWindow x=780 y=186 w=26 h=86/>` — окно выдачи кухни,
  лаунж-сторона.
- `<BottleShelves x=810 y=196 width=210 rows=2/>` — стеклянная
  витрина за баром.
- Деревянная декоративная планка по верху барной стойки.
- 3 бокала на стойке слева + латунный шейкер справа.
- 6 высоких барных стульев (`<BarStool>`) в линию перед стойкой.
- Кухонные полки сверху и снизу зоны кухни.
- Подвесные люстры над лаунж-столами (10 шт. на типовых местах
  столов 27/29/32–35), над баром (cx=914,236) и над выходом
  (cx=131,252 / cx=131,462).

### 19.5 SVG-defs Phase 12

В `<defs>` `TableMap.tsx` добавлены:
- `linearGradient id="brass"` — латунь (плафоны, шейкер, окантовки полок).
- `linearGradient id="lampCone"` — конус под подвесной лампой.
- `radialGradient id="fireGlow"` — янтарное свечение гриля.
- `linearGradient id="woodPlank"` — тёмное дерево для полок.
- `linearGradient id="bottleShelf"` + `linearGradient id="ledShelf"` — стеклянная витрина с LED.
- `linearGradient id="banner"` — тёмный фон баннера «МЯСО · БАР».

CSS-цвета:
```ts
const brassTop = '#e8c882'
const brassBottom = '#8c6422'
const fireHot = '#ff7a18'
const fireMid = '#ff3d12'
const fireDark = '#7a1a0a'
const bottleGreen = '#244a2c'
const bottleAmber = '#7a3818'
const bottleClear = '#a8c8d0'
const stoolSeat = '#1a110c'
const stoolBrass = '#c69a3e'
const grillBars = '#1a0a06'
```

### 19.6 Файлы Phase 12

**Изменены:**
- `src/components/TableMap.tsx` — 11 декор-компонентов (см. §19.2),
  6 новых SVG-defs (§19.5), переписанные `Hall1`/`Hall2`,
  условная сервировка (§19.3).
- `src/components/tablemap.css` — анимации
  (`floor-flame-flicker`, `floor-candle-flame`,
  `floor-cone-breathe`, `floor-sconce-pulse`), стили баннера
  (`.floor-banner-text`), filter-`drop-shadow` на декор
  (.floor-pendant, .floor-grill, .floor-bar-stool, …),
  data-`light` варианты конуса.
- `src/pages/HomePage.tsx` — функция `scrollToBooking()` на
  «Бронь» в шапке + мобильный CTA «Выбрать стол».
- `public/sw.js` — bumped `v22 → v23` для новых ассетов.

**Новых файлов нет.** Phase 12 — пакет в существующих компонентах.

### 19.7 Производительность и mobile / PWA Phase 12

- Все декор-`<g>` имеют `pointerEvents="none"` — никакого
  перехвата кликов столов.
- Анимации огня/свечи/бра уважают `prefers-reduced-motion: reduce`
  через общий блок в `tablemap.css` (см. §18.5).
- `drop-shadow` стоит на компонентах целиком, а не на каждом
  внутреннем узле — Chrome рендерит фильтр один раз на `<g>`.
- На `(max-width: 480px)` мелкие декоративные элементы
  (Vase, TableCandle, BarStool) физически на схеме плохо
  читаются, но и не мешают — их размер пропорционален viewBox,
  а не пикселям, поэтому отдельных мобильных правил для них
  не нужно.

### 19.8 Что НЕ делать в Phase 12

- **НЕ давать декору `pointerEvents="auto"`** — клик по
  «стулу» / «лампе» не должен открывать карточку стола.
  Все декор-группы остаются «прозрачными» для курсора.
- **НЕ возвращать сервировку («3 тарелки + 2 ножа + бокал»)
  на ВСЕ столы.** Это уже сбивало пользователя в Phase 10.
  Сейчас сервировка — точечно (см. §19.3).
- **НЕ накладывать пламя гриля на интерактивную зону столов.**
  Гриль и кухня всегда рендерятся в `<Hall1/>` / `<Hall2/>` ДО
  блока столов, а сами столы лежат поверх — пламя не должно
  «выезжать» в обеденную зону.
- **НЕ ставить анимации с `infinite` на каждый декор-узел.**
  В Phase 12 анимирован только огонь, свеча, конус-«дыхание»
  и бра. Бутылки, стулья, баннеры, тарелки — статичны.
- **НЕ дублировать `defs` между фазами.** Если будете
  добавлять новый decor-gradient — кладите в общий `<defs>`
  внутри `TableMap.tsx`, а не делайте локальный inline в
  компоненте: дубликаты `id` ломают SVG-рендер.
- **НЕ забывать bumpить `sw.js VERSION`** при любом изменении
  CSS / JS. После Phase 12 это `v23`. Иначе клиенты-PWA
  застрянут на прошлой версии без декора.
