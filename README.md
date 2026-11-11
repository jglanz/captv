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
| `pnpm dev` | Webpack watch for main/preload, dev server for the renderer, then launches Electron |
| `pnpm build` | Production webpack builds of main, preload and renderer into `dist/` |
| `pnpm package` | Build, then package with electron-builder into `release/` |
| `pnpm test` | Run the Jest unit tests (ts-jest, config in `jest.config.js` / `tsconfig.test.json`) |
| `pnpm release` | Starts the GitHub Actions release workflow (patch bump) |

`pnpm-workspace.yaml` allows the install scripts of `electron` (downloads the Electron binary) and `electron-winstaller`, and denies the `@parcel/watcher` one; its native binary comes from its optional dependencies.

## Releasing

Releases run entirely in GitHub Actions (`.github/workflows/release.yml`), started by `pnpm release` or by `gh workflow run release.yml --ref master -f bump=<patch|minor|major|none>`:

1. The `version` job runs `pnpm version`, which builds and tests the app (`preversion`), commits and tags `vX.Y.Z`, and pushes both to `master`.
2. The `package` jobs check out that tag on Linux, Windows and macOS and run `pnpm package --publish never`, producing the AppImage and snap, the NSIS installer, and the dmg and zip (unsigned).
3. The `publish` job creates the GitHub release for `vX.Y.Z` with generated notes and attaches every package. If the release already exists, it replaces the assets instead.

A failed `package` or `publish` job can be re-run on its own: it releases the same tag. `bump=none` releases the version already in `package.json` at the dispatched commit without bumping; the release creates the tag on that commit.
