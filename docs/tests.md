# Tests

## Test Stack

The project uses:

- `vitest` for unit and integration tests
- `@testing-library/react` for renderer component behavior
- `playwright` for an Electron smoke test

## Commands

- `npm test`: runs the Vitest suite
- `npm run test:watch`: runs Vitest in watch mode
- `npm run test:e2e`: runs the Playwright Electron smoke test
- `npm run build`: required before `npm run test:e2e`

## What Is Covered

Current automated coverage includes:

- `src/renderer/src/configIO.test.ts`: JSONC parsing, routing replacement, tag extraction, validation, and rule serialization
- renderer tests for `App`, `Toolbar`, `RuleEditor`, and `PreviewModal`
- `src/preload/index.test.ts`: preload API exposure and IPC forwarding
- `src/main/index.test.ts`: dialog handlers, save behavior, and `.bak` backup creation

## E2E Notes

The Playwright test launches the built Electron app from the repository root. On hosts without the required Electron runtime libraries or display support, the smoke test skips instead of failing.

Recommended local flow:

```bash
npm test
npm run build
npm run test:e2e
```
