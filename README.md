# CapTV

Electron app for watching a capture card as a TV, with remote control support for networked devices (Apple TV via a WebSocket bridge).

## Layout

- `src/main/` — Electron main process (window, settings persisted to `~/.config/tv-view/settings.json`)
- `src/preload/` — preload bridge
- `src/renderer/` — React UI (Tailwind)
- `src/shared/` — code shared across processes (settings types, remote-control framework)
- `test/` — Jest unit tests
- `dist/` — webpack build output; `release/` — electron-builder packages

## Commands

[pnpm](https://pnpm.io) is the package manager, at the version pinned by the `packageManager` field of `package.json`.

| Command | What it does |
|---|---|
| `pnpm install` | Installs dependencies from `pnpm-lock.yaml` |
| `pnpm dev` | Webpack watch for main/preload, dev server for the renderer, `tsc` type checking in watch mode, then launches Electron |
| `pnpm typecheck` | Type checks the main/preload/shared and renderer projects (`tsc -b`) and the tests (`tsconfig.test.json`) |
| `pnpm build` | `pnpm typecheck`, then production webpack builds of main, preload and renderer into `dist/` |
| `pnpm package` | Build, then package with electron-builder into `release/` |
| `pnpm test` | Run the Jest unit tests (transpiled by `@swc/jest`, config in `jest.config.js`) |
| `pnpm release` | Starts the GitHub Actions release workflow (patch bump) |

TypeScript 7 is the native compiler and has no JavaScript compiler API, so it only type checks. Webpack transpiles every target with `swc-loader`, using the rules shared in `webpack.swc.js`, and Jest uses `@swc/jest`.

`pnpm-workspace.yaml` allows the install scripts of `@swc/core` (checks its native binding), `electron` (downloads the Electron binary) and `electron-winstaller`, and denies the `@parcel/watcher` one; its native binary comes from its optional dependencies.

## Releasing

Releases run entirely in GitHub Actions (`.github/workflows/release.yml`), started by `pnpm release` or by `gh workflow run release.yml --ref master -f bump=<patch|minor|major|none>`:

1. The `version` job runs `pnpm version`, which builds and tests the app (`preversion`), commits and tags `vX.Y.Z`, and pushes both to `master`.
2. The `package` jobs check out that tag on Linux, Windows and macOS and run `pnpm package --publish never`, producing the AppImage and snap, the NSIS installer, and the dmg and zip (unsigned).
3. The `publish` job creates the GitHub release for `vX.Y.Z` with generated notes and attaches every package. If the release already exists, it replaces the assets instead.

A failed `package` or `publish` job can be re-run on its own: it releases the same tag. `bump=none` releases the version already in `package.json` at the dispatched commit without bumping; the release creates the tag on that commit.
