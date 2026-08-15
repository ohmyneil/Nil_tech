# Neil Tanamor Portfolio

A lightweight, dependency-free portfolio website.

## Run locally

```powershell
node server.js
```

Then open [http://127.0.0.1:8080/](http://127.0.0.1:8080/).

## Project structure

- `index.html` — page structure
- `css/styles.css` — visual design, responsive rules, and motion
- `js/data.js` — portfolio content
- `js/main.js` — rendering and interactions
- `js/firebase.js` — Firebase app and production Analytics setup
- `assets/images/` — profile and project images
- `assets/documents/` — downloadable resume
- `server.js` — local development server

## Contact form delivery

The portfolio contact form submits directly to Formspree at `https://formspree.io/f/mzepapbw`, so it can deliver messages on static hosts such as GitHub Pages. Set the notification recipient and spam-protection settings in the Formspree dashboard for that form.

The existing server SMTP route remains available as an optional self-hosted alternative, but it is not used by the public form.

## Firebase Analytics

Firebase is initialized from `js/firebase.js` using the registered web-app configuration. Google Analytics starts only on supported HTTPS deployments, so local development does not add test traffic to the production property. Firebase Analytics is separate from the Formspree contact-delivery flow; Firebase Authentication, Firestore, or Functions require their own service-specific setup and Security Rules.
