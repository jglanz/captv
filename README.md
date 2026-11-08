# CapTV

Electron app for watching a capture card as a TV, with remote control support for networked devices (Apple TV via a WebSocket bridge).

## Layout

- `src/main/` — Electron main process (window, settings persisted to `~/.config/tv-view/settings.json`)
- `src/preload/` — preload bridge
- `src/renderer/` — React UI (Tailwind)
- `src/shared/` — code shared across processes (settings types, remote-control framework)
- `test/` — Jest unit tests
- `dist/` — webpack build output; `release/` — electron-builder packages

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Webpack watch for main/preload, dev server for the renderer, then launches Electron |
| `npm run build` | Production webpack builds of main, preload and renderer into `dist/` |
| `npm run package` | Build, then package with electron-builder into `release/` |
| `npm test` | Run the Jest unit tests (ts-jest, config in `jest.config.js` / `tsconfig.test.json`) |

## Releases

`.github/workflows/release.yml` runs on every push to `master`: it runs the tests, bumps the patch version (`npm version patch`), pushes the commit and tag, and creates a GitHub release with generated notes.
