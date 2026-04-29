# AGARTHA: FALSE GUIDE - Technical & Release Report

**Agartha: False Guide** is a narrative-driven space shooter web game built with vanilla JavaScript and HTML5 Canvas. The game features a 30-level campaign, a dialogue system, multiple mission types, boss fights, music, portrait-driven story scenes, and a persistent upgrade system.

This repository is prepared for public use as a static web project. It does not require a backend server, API key, webhook, analytics account, or hosted third-party service to run locally.

## Table of Contents
1.  [Screenshots](#screenshots)
2.  [Technical Report](#technical-report)
    *   [Architecture](#architecture)
    *   [Core Systems](#core-systems)
    *   [Game Loop](#game-loop)
    *   [Rendering](#rendering)
    *   [Input Handling](#input-handling)
    *   [Audio System](#audio-system)
    *   [State Management](#state-management)
    *   [Content & Level Design](#content--level-design)
3.  [Setup Guide](#setup-guide)
4.  [Developer Menu](#developer-menu)
5.  [Deployment Guide](#deployment-guide)
6.  [Project Hygiene](#project-hygiene)
7.  [License](#license)

---

## Screenshots

| Main Menu | Gameplay | Level 30 Boss |
| --- | --- | --- |
| ![Main menu](assets/screenshots/main_menu.png) | ![Gameplay](assets/screenshots/gameplay.png) | ![Level 30 boss fight](assets/screenshots/level_30_boss.png) |

---

## Technical Report

### Architecture
The project follows a modular architecture using ES modules. The codebase is organized into functional domains:

*   **Entry Point**: `index.html` serves as the game container, and `js/main.js` initializes the game loop and connects subsystems.
*   **State Management**: `js/state.js` centralizes game state, player progress, upgrade data, and `localStorage` persistence.
*   **Rendering**: `js/renderer.js` abstracts the HTML5 Canvas 2D API and handles visual output, effects, and procedural drawing.
*   **Input**: `js/input.js` normalizes keyboard, mouse, gamepad, and touch input.
*   **Audio**: `js/audio.js` manages Web Audio playback, music tracks, and procedural sound effects.
*   **Entities**: `js/entities/` contains game object modules such as power-ups.
*   **Data**: `js/data/levels.js` contains level configuration, enemy waves, dialogue, and mission objectives.
*   **Scenes**: `js/scenes/story.js` manages the narrative overlay and dialogue progression.
*   **Assets**: `assets/` contains runtime music and portrait files.

### Core Systems

#### Game Loop
The game uses a standard `requestAnimationFrame` loop in `js/main.js`. It separates update and render phases so gameplay logic stays predictable across different frame rates. The loop pauses during dialogue sequences, menu screens, and pause states.

#### Rendering
Most gameplay visuals are generated procedurally at runtime using Canvas 2D drawing primitives. This keeps the core game lightweight while still supporting shields, trails, particles, enemy shapes, and dynamic backgrounds.

**Key Rendering Features:**
*   **Procedural Enemies**: Enemies are drawn from geometric primitives and gradients.
*   **Particle Systems**: Explosions and engine trails are handled as lightweight particles.
*   **Dynamic Background**: `js/renderer.js` draws a scrolling starfield behind gameplay.

#### Input Handling
The `Input` module exposes a unified state object that the game loop polls.

*   **Keyboard**: Arrow keys and WASD.
*   **Gamepad**: Standard Gamepad API mappings with vibration patterns where supported.
*   **Touch**: Mobile joystick and fire controls are rendered for touch devices.

#### Audio System
The `AudioManager` wraps the Web Audio API.

*   **Music**: Loads MP3 files from `assets/music/`.
*   **SFX**: Generates sound effects procedurally with oscillators, so gameplay still has effects without separate SFX files.
*   **Voices**: Dialogue voice ticks are generated from lightweight patch definitions.

#### State Management
Game persistence is handled in `js/state.js`.

*   **Storage**: `localStorage` saves progress, currency, and purchased upgrades.
*   **Session State**: Runtime state tracks health, entities, mission counters, effects, and active level data.

#### Content & Level Design
Levels are defined in `js/data/levels.js` as configuration objects.

*   `survive`: Survive for a set time limit.
*   `collect`: Gather a target amount of Elixir.
*   `destroy`: Eliminate a target number of enemies.
*   `boss`: Defeat a boss entity.

Each level can define `preDialogue` and `postDialogue` arrays to trigger narrative scenes before or after gameplay.

---

## Setup Guide

For complete setup instructions, see [SETUP.md](SETUP.md).

Quick start:

1.  Clone the repository.
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  Start a local HTTP server.
    ```bash
    python3 -m http.server 8000
    ```

3.  Open the game.
    ```text
    http://localhost:8000
    ```

4.  Run the JavaScript logic tests.
    ```bash
    npm test
    ```

The game must be served over HTTP because ES modules are blocked by many browsers when opened directly with `file://`.

---

## Developer Menu

The in-game developer menu is hidden by default. To open it:

1.  Start or continue a level.
2.  Advance any story dialogue until the HUD is visible.
3.  Click the mission objective in the top-right HUD three times within three seconds.
4.  Click the `DEV` button that appears near the upper-right corner.

The menu includes theme controls, balance sliders, invincibility, level navigation, restart, complete-level, and Elixir test controls. It is intended for local testing and tuning, not normal player progression.

---

## Deployment Guide

The game is a static site. Any host that can serve `index.html`, JavaScript, CSS, images, and MP3 files can run it.

Supported options:

*   **Static hosting**: GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3 static hosting, or any similar provider.
*   **Self-hosted VPS**: Use the optional scripts in `deployment/`.
*   **Manual Nginx**: Use `deployment/nginx.conf` as a template.

Optional VPS deployment:

1.  Copy the example config.
    ```bash
    cp deployment/deploy.config.example deployment/deploy.config
    ```

2.  Fill in your server, SSH key, domain, and remote directory.

3.  Run the deploy script.
    ```bash
    ./deployment/deploy.sh
    ```

The deploy script intentionally reads from ignored local config. No server IPs, SSH keys, deployment tokens, or webhooks should be committed.

More deployment references:

*   Full VPS setup: [deployment/VPS_SETUP.md](deployment/VPS_SETUP.md)
*   Nginx template: [deployment/nginx.conf](deployment/nginx.conf)
*   Inactive GitHub Actions template: [deployment/github-actions-deploy.example.yml](deployment/github-actions-deploy.example.yml)

---

## Project Hygiene

Public-release cleanup expectations:

*   Keep private deployment values in `deployment/deploy.config`.
*   Keep `.env`, SSH keys, certificates, local editor settings, release archives, screenshots, and OS metadata out of git.
*   Use `deployment/github-actions-deploy.example.yml` only as a template. It is not active unless copied into `.github/workflows/`.
*   Replace sample domains, paths, and repository URLs before publishing your own fork.
*   Run `npm test` before release changes.

---

## License

This project is released under the [Unlicense](LICENSE). You may use, copy, modify, publish, distribute, sell, or reuse it for personal or commercial work without attribution requirements.
