# Xray Routing Editor

Xray Routing Editor is a desktop GUI for editing the `routing` section of an `xray-core` configuration file. It is intended for users who want to manage routing rules visually instead of editing JSON or JSONC by hand.

The app follows the official Xray routing model documented by Project X:

- <https://xtls.github.io/en/config/routing.html>

## How It Relates to Xray

In Xray, the `routing` object contains fields such as:

- `domainStrategy`
- `rules`
- `balancers`

Rules match traffic by attributes such as domain, IP/CIDR, port, source port, inbound tag, user, protocol, and network, then route matching traffic to an `outboundTag` or `balancerTag`. Rule order matters: Xray evaluates rules from top to bottom and uses the first effective match. When no rule matches, traffic falls back to the first outbound by default. This editor is built around that behavior.

The app currently helps with:

- opening an existing Xray config file
- extracting known inbound, outbound, balancer, and user tags from the config
- editing routing rules in a structured form
- reordering rules
- previewing routing changes before save
- writing the updated `routing` section back while preserving comments and unrelated JSONC content outside that section

## Project Structure

- `src/main/`: Electron main process
- `src/preload/`: preload bridge exposed as `window.electronAPI`
- `src/renderer/`: React UI built with Vite
- `src/renderer/src/configIO.ts`: parsing, validation, serialization, and routing replacement logic
- `example.json`: sample config input
- `build/`: app icon assets used for packaging

## Build and Run

From the repository root:

```bash
npm install
npm run dev
```

Useful commands:

- `npm run dev`: start the Electron + Vite development app
- `npm run build`: compile the app into `out/`
- `npm run start`: preview the built app
- `npm run dist:linux`: create a Linux package with `electron-builder`
- `npm run dist:win`: create a Windows package with `electron-builder`

## Tests

The repository includes:

- `vitest` for unit and integration tests
- `@testing-library/react` for renderer behavior
- `playwright` for an Electron smoke test

Run them with:

```bash
npm test
npm run build
npm run test:e2e
```

More detail is available in `docs/tests.md`.

## Notes

- This app edits routing configuration only; it is not a replacement for the full `xray-core` config format.
- Packaged app metadata such as product name, version, and icon are defined in `package.json`.
