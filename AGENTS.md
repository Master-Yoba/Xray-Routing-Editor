# Repository Guidelines

## Project Structure & Module Organization
This repository contains an Electron desktop app for managing Xray routing configuration described at <https://xtls.github.io/en/config/routing.html>. Source code lives under `src/`:

- `src/main/`: Electron main-process startup and file dialog logic.
- `src/preload/`: preload bridge exposed to the renderer as `window.electronAPI`.
- `src/renderer/`: Vite-powered React UI. Main app code is in `src/renderer/src/`, with `components/`, `fields/`, shared types in `types.ts`, and config parsing/rewrite logic in `configIO.ts`.

Build output goes to `out/`, packaged artifacts go to `dist/`, and `example.json` provides sample configuration data.

## Build, Test, and Development Commands
- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: launch the Electron + Vite development environment.
- `npm run build`: compile main, preload, and renderer bundles into `out/`.
- `npm run start`: preview the built app locally.
- `npm run dist:linux` / `npm run dist:win`: package the app with `electron-builder`.

Run commands from the repository root.

## Coding Style & Naming Conventions
Use TypeScript, React function components, 2-space indentation, single quotes, and no semicolons to match the existing code. Prefer named exports and descriptive helper names such as `handleSaveAs` or `replaceRoutingInJsonc`.

Use `PascalCase` for components (`PreviewModal.tsx`), `camelCase` for functions and state, and keep CSS files colocated with the related component where practical.

## Testing Guidelines
No automated test framework is configured yet. Before opening a PR:

- run `npm run build` to catch TypeScript or bundling regressions;
- smoke-test `npm run dev` by opening a config, editing routing rules, previewing the diff, and saving output;
- verify comment-preserving behavior when touching `configIO.ts`.

## Commit & Pull Request Guidelines
The current history is minimal (`initial`), so keep commits short, imperative, and focused, for example `Add rule preview modal`.

PRs should include a brief summary, manual verification steps, linked issues when applicable, and screenshots for UI changes.

## Security & Configuration Tips
Treat configuration files as user data. Do not commit private configs or secrets, and preserve unrelated JSONC sections and comments when modifying routing output behavior.
