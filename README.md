# Neil Tanamor Portfolio

A lightweight portfolio website for Neil Ivan V. Tanamor.

## Run locally

```powershell
npm start
```

Then open [http://127.0.0.1:8080/](http://127.0.0.1:8080/).

## Project structure

- `index.html` - page structure
- `css/styles.css` - visual design, responsive rules, and motion
- `js/data.js` - portfolio content
- `js/main.js` - rendering and interactions
- `assets/images/` - profile and project images
- `assets/documents/` - downloadable resume
- `server.js` - local development server

## Pixel cat companion

The cat is already mounted in `index.html`. It uses `css/pixel-pet.css` and the
reusable `mountPixelPet` export in `js/pixel-pet.js`. Its original pixel artwork
is embedded as SVG, so no external assets or dependencies are required. Colors
inherit the existing theme; fur colors can be customized with `--pet-fur` and
`--pet-outline` in the component stylesheet.
Keep `js/pet-playground.js` alongside the component: it supplies platform
discovery, gravity, landing detection, and behavior scheduling.

To add it to another page with the same theme variables, include the stylesheet
and mount once after the page body exists:

```html
<link rel="stylesheet" href="css/pixel-pet.css">
<script type="module">
  import { mountPixelPet } from './js/pixel-pet.js';
  const pet = mountPixelPet({
    projects: '#experience',
    contact: '#contact',
    storageKey: 'portfolio-pixel-pet'
  });
  // For an application that unmounts this page: pet.destroy();
</script>
```

- Click/tap the cat, or focus it and press Enter/Space, for a happy greeting.
- Drag the cat or use arrow keys while it is focused; Shift moves it farther.
- Open the dots button for section links, a checked **Mute Messages** toggle,
  and **Hide Pet**. Tab moves between actions; Escape closes the menu.
- **Show cat** restores a hidden companion. Visibility and message preferences
  are saved locally, with an in-memory fallback if storage is unavailable.
- The cat starts exploring after 2.5 seconds. Actual project cards, credentials,
  section headings, and the navbar act as platforms. It walks, runs, jumps with
  gravity, sits on headings, peeks over card edges, and naps in available navbar
  gaps. Platforms are remeasured on scroll, resize, and content size changes.
  Scrolling down makes it trot right; scrolling up makes it trot left. After
  scrolling stops, it resumes exploring, favoring platforms in that direction.
- Short mouse-cursor chases stay on the current platform. Every few trips the
  cat bats a tiny yarn ball; mobile visitors see yarn play without needing a mouse.
  Exploration alternates with 4.5–10.5 second pauses and 14 second navbar naps.
  It pauses for hover, keyboard focus, dragging, menus, and form entry; the
  physics loop and CSS animations pause when the browser tab is inactive.
  Friendly prompts appear at most once every 96 seconds while the page is active.
  Muting disables all speech bubbles, including greetings.
- Reduced motion disables animations, unsolicited prompts, and smooth anchor
  scrolling. The happy face still responds to activation.
- The mobile cat is smaller; transparent surrounding space passes clicks through.
  Dragging and viewport resizing keep it within view, including when the mobile
  keyboard opens. The companion can be moved or hidden wherever content is dense.

Run `npm.cmd start` on Windows (or `npm start` elsewhere), then open the local
site. `npm.cmd run build` includes all component files automatically.

Run `node --test tests/pet-playground.test.mjs` for physics and behavior checks.

## Contact form delivery

The portfolio contact form submits directly to Formspree at `https://formspree.io/f/mzepapbw`, so it can deliver messages on static hosts such as GitHub Pages. Set the notification recipient and spam-protection settings in the Formspree dashboard for that form.

The existing server SMTP route remains available as an optional self-hosted alternative, but it is not used by the public form.

## Cloudflare static deployment

The static-site deployment configuration is in `wrangler.jsonc`. It deploys only the source site assets (`index.html`, `css/`, `js/`, and `assets/`), so deployment does not depend on the ignored local `dist/` folder:

```powershell
npx wrangler deploy
```

The build copies `index.html`, `css`, `js`, and `assets` into the ignored `dist/` directory used for the static deployment.
