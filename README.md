# Neil Tanamor Portfolio

A lightweight, dependency-free portfolio website.

## Run locally with PAKO

```powershell
npm.cmd run dev:worker
```

Then open [http://localhost:8787/](http://localhost:8787/). Wrangler will ask you to sign in to Cloudflare if needed.

## Static-only local server

```powershell
node server.js
```

Then open [http://127.0.0.1:8080/](http://127.0.0.1:8080/). This mode is useful for layout work, but PAKO is unavailable because `/api/ai` runs in the Cloudflare Worker.

## Project structure

- `index.html` — page structure
- `css/styles.css` — visual design, responsive rules, and motion
- `js/data.js` — portfolio content
- `js/main.js` — rendering and interactions
- `js/firebase.js` — Firebase app and production Analytics setup
- `worker/index.js` — Cloudflare Worker API routes, including PAKO, the portfolio assistant
- `assets/images/` — profile and project images
- `assets/documents/` — downloadable resume
- `server.js` — local development server

## Contact form delivery

The portfolio contact form submits directly to Formspree at `https://formspree.io/f/mzepapbw`, so it can deliver messages on static hosts such as GitHub Pages. Set the notification recipient and spam-protection settings in the Formspree dashboard for that form.

The existing server SMTP route remains available as an optional self-hosted alternative, but it is not used by the public form.

## Firebase Analytics

Firebase is initialized from `js/firebase.js` using the registered web-app configuration. Google Analytics starts only on supported HTTPS deployments, so local development does not add test traffic to the production property. Firebase Analytics is separate from the Formspree contact-delivery flow; Firebase Authentication, Firestore, or Functions require their own service-specific setup and Security Rules.

## Cloudflare Workers deployment

The static-site deployment configuration is in `wrangler.jsonc`. Build the assets before deploying:

```powershell
npm run build
npx wrangler deploy
```

The build copies `index.html`, `css`, `js`, and `assets` into the ignored `dist/` directory used by Cloudflare Workers Static Assets.

## PAKO portfolio assistant

PAKO sends same-origin requests to `/api/ai`. In production, that endpoint is handled by `worker/index.js` and uses the Cloudflare Workers AI binding configured in `wrangler.jsonc`.

To test the full site, including AI, locally after signing in to Cloudflare:

```powershell
npm run dev:worker
```

The ordinary `npm start` server remains useful for static-site work, but it does not include the Cloudflare AI binding.
