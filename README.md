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

## Contact form delivery

The portfolio contact form submits directly to Formspree at `https://formspree.io/f/mzepapbw`, so it can deliver messages on static hosts such as GitHub Pages. Set the notification recipient and spam-protection settings in the Formspree dashboard for that form.

The existing server SMTP route remains available as an optional self-hosted alternative, but it is not used by the public form.

## Cloudflare static deployment

The static-site deployment configuration is in `wrangler.jsonc`. It deploys only the source site assets (`index.html`, `css/`, `js/`, and `assets/`), so deployment does not depend on the ignored local `dist/` folder:

```powershell
npx wrangler deploy
```

The build copies `index.html`, `css`, `js`, and `assets` into the ignored `dist/` directory used for the static deployment.
