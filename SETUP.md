# AGARTHA: FALSE GUIDE - Setup Guide

This guide covers local setup, test commands, asset expectations, and optional deployment for **AGARTHA: FALSE GUIDE**.

## Table of Contents
1.  [Requirements](#requirements)
2.  [Project Structure](#project-structure)
3.  [Local Development](#local-development)
4.  [Developer Menu](#developer-menu)
5.  [Testing](#testing)
6.  [Deployment Setup](#deployment-setup)
7.  [Troubleshooting](#troubleshooting)

---

## Requirements

Required:

*   A modern browser with Canvas, ES module, and Web Audio support.
*   Python 3 or Node.js for a local HTTP server.

Recommended:

*   Node.js 18 or newer for `npm test`.
*   `rsync`, `ssh`, `scp`, and Nginx if using the optional VPS deploy script.

No API keys, webhook URLs, external service accounts, or backend services are required to play or develop the game locally.

---

## Project Structure

Key paths:

*   `index.html`: Browser entry point.
*   `css/`: Game layout, theme, and mobile styles.
*   `js/`: Game logic split into state, rendering, input, audio, scenes, entities, and level data.
*   `assets/music/`: Runtime music tracks.
*   `assets/portraits/`: Runtime character portraits.
*   `tests/`: Node, browser, and Playwright-oriented test helpers.
*   `deployment/`: Optional self-hosting templates and scripts.

---

## Local Development

Clone the repository:

```bash
git clone <repository-url>
cd <repository-folder>
```

Start a local server with Python:

```bash
python3 -m http.server 8000
```

Or use Node:

```bash
npx http-server .
```

Open:

```text
http://localhost:8000
```

Do not open `index.html` directly with `file://`; browser module loading rules can block ES module imports.

---

## Developer Menu

The developer menu is available in-game for local testing.

To open it:

1.  Start `NEW STORY`, continue a save, or enter a level through `FREE MODE`.
2.  If dialogue is visible, advance it until normal gameplay starts.
3.  Click the mission objective text in the top-right HUD three times within three seconds.
4.  Click the `DEV` button that appears near the upper-right corner.

Available controls include:

*   Theme selection.
*   Player speed, max velocity, fire rate, pickup range, asteroid speed, enemy speed, and spawn rate sliders.
*   God Mode.
*   Previous/next level controls.
*   Restart level and complete level actions.
*   `+100 Milk` test currency.

This menu is intentionally hidden behind the HUD click sequence so it remains available to maintainers without affecting normal play.

---

## Testing

Run the default logic tests:

```bash
npm test
```

Run individual Node tests:

```bash
node tests/run_node.js
node tests/test_spatial.js
```

Run the benchmark helper:

```bash
npm run benchmark
```

Some browser verification files in `tests/` are intended to be opened through a local server or driven by Playwright.

---

## Deployment Setup

### Static hosting

For static hosts such as GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3 static hosting, or any equivalent provider, publish the repository root or the files needed by `index.html`:

*   `index.html`
*   `css/`
*   `js/`
*   `assets/`

Do not publish `.git`, `.env`, `deployment/deploy.config`, local screenshots, logs, or private keys.

### VPS hosting

Copy the deployment config template:

```bash
cp deployment/deploy.config.example deployment/deploy.config
```

Fill in `deployment/deploy.config`, then run:

```bash
./deployment/deploy.sh
```

See `deployment/VPS_SETUP.md` for the full VPS flow, including server packages, Nginx, DNS, SSL, and verification.

### GitHub Actions

An inactive workflow template is available at `deployment/github-actions-deploy.example.yml`.

To use it:

1.  Copy it to `.github/workflows/deploy.yml` in your own repository.
2.  Configure repository secrets for `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY`.
3.  Adjust the remote path in the workflow if your server does not deploy to `/var/www/agartha-false-guide`.

The template is intentionally not active in this public repository.

---

## Troubleshooting

**The screen is blank.**

Serve the project over HTTP and check the browser console for blocked module imports or missing files.

**Music does not start immediately.**

Browsers require a user interaction before audio playback. Click or tap in the game first.

**Portraits or music fail to load.**

Confirm the `assets/` directory was uploaded. The deploy script includes runtime assets by default.

**Deployment fails before upload.**

Check that `deployment/deploy.config` exists, all placeholder values are replaced, and `SSH_KEY_PATH` points to an existing private key.
