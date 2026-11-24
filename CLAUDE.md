# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

TieZ is a local-first Windows clipboard manager (history, search, images, rich text, files). It is a Tauri 2 app: a Rust backend in `src-tauri/` and a React 19 + TypeScript + Vite frontend in `src/`. It targets Windows 10/11 only, ships one theme (Mica) and Simplified Chinese only, and has no network, sync, AI or file-transfer features.

## Commands

### Develop and build

- `npm ci` — install frontend dependencies (CI uses Node 20 for the app; the e2e runner needs Node >= 22.22.3 or >= 24.8).
- `npm run tauri:dev` — the real desktop app: applies the version, then runs `tauri dev` with the `devtools` feature and `src-tauri/tauri.dev.conf.json`.
- `npm run dev` — Vite only (`http://localhost:1420`). The UI renders, but Tauri IPC/events are unavailable; the relevant code paths are guarded by `isTauriRuntime()` and the history stays empty. Use the e2e harness for browser work.
- `npm run build` — `tsc` (type-check, no emit) plus `vite build` into `dist/web`.
- `npm run tauri:build` — production desktop bundle.
- `npm run build:exe` — one-click Windows release executable at `artifacts/TieZ_<version>_x64.exe` (no installer). `build-exe.bat` is the double-click entry point; `npm run build:installer` builds the NSIS installer and needs the signing key from `.env`.
- Copy `.env.example` to `.env` for release builds: it supplies the updater/announcement endpoints and the updater public key (`TIEZ_*` and `VITE_TIEZ_*` variables).

### Tests

- `npm test` — Vitest unit and contract tests (`src/**/*.test.ts`).
- `npx vitest run src/shared/lib/clickPaste.test.ts` — run one test file.
- `npx vitest run -t "i18n translations consistency"` — run tests by name.
- `npm run test:coverage` — V8 coverage report (report-only, no thresholds).
- `npm run test:rust` — `cargo test --manifest-path src-tauri/Cargo.toml`; a single test: `cargo test --manifest-path src-tauri/Cargo.toml <name>`.
- `npm run test:e2e` — browser UI e2e against the mocked Tauri harness in `e2e/`. First run: `cd e2e && npm ci && npx e2e-web install chromium`, then from the root `npm run test:e2e`. Watch it with `npm --prefix e2e run test:headed`.
- `npm run preflight` — the full local gate: release metadata, ESLint, style lint, Vitest, tsc, production build, updater HTTPS check, `cargo test`, UI e2e, native smoke, and docs-site checks. `npm run preflight -- --quick` skips Rust/native/docs/build; `--no-native --no-docs` skips those two. Docs steps only run when the sibling `../tiez-docs` and `../tiez-e2e` checkouts exist.

### Lint and style checks

- `npm run lint` — ESLint (React hooks rules and correctness checks only).
- `npm run lint:styles` — enforces `docs/DESIGN-SYSTEM.md` against `scripts/style-lint-baseline.json`; per-file violation counts may only go down. `npm run lint:styles -- --report` lists every violation; `-- --update` rewrites the baseline after fixes.

### Versions and releases

- `versions.json` is the single source of truth (`stable`/`beta` × `windows`). `npm run apply-version` (`:win`) copies that version into `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`; do not hand-edit those version fields.
- `npm run validate-release-matrix` and `npm run validate-release` check version, channel, and tag consistency.
- `npm run release:stable:win` and `npm run release:beta:win` build installers; `npm run build:portable` builds the Windows portable zip. GitHub workflows trigger on `v*` tags plus the beta workflows. See `docs/RELEASES.md`.

## Architecture

### Process and windows

`src-tauri/src/main.rs` is the real entry point: it builds the Tauri app, installs plugins, and registers every IPC command in one `generate_handler![...]` list. `src-tauri/src/lib.rs` is the untouched Tauri template and is not used; do not put code there.

Several windows share one frontend bundle. `src/main.tsx` chooses the root component from the URL: `?window=compact-preview` → `CompactPreviewWindow`, `?window=pin-sticker` → `PinStickerWindow`, otherwise `App`. The main window is a frameless, transparent 352×380 panel. Rust owns positioning, edge docking, focus handoff, and creating the auxiliary windows (`app/window_manager.rs`, `app/commands/ui_cmd.rs`).

### IPC contract

The frontend calls `invoke("<command>", { camelCaseArgs })` from `@tauri-apps/api/core`. Tauri maps camelCase keys to Rust snake_case parameters; passing `content_type` instead of `contentType` silently drops the argument. `src/contracts/tauriCommands.test.ts` parses Rust `#[tauri::command]` signatures and TypeScript call sites, so:

- a new command must be registered in `src-tauri/src/main.rs`'s `generate_handler![...]`;
- every required Rust parameter must be passed;
- no argument the command does not take may be passed;
- argument keys must use the camelCase form.

Command modules live in `src-tauri/src/app/commands/` (history, clipboard, settings, hotkeys, files, themes, system); the paste queue service exposes its own commands.

### Rust backend layout

- `app/` — lifecycle (`setup.rs::init` wires the DB, services, listeners, tray, and window events), `window_manager.rs`, `tray.rs`, `hooks/` (Windows message hooks), `light_mode.rs`, `commands/`.
- `services/` — capture and behavior: `clipboard/pipeline.rs` + `clipboard/utils.rs`, `clipboard_listener.rs`, `clipboard_ops.rs`, `content_handler.rs`, `paste_queue.rs`, `encryption_queue.rs`, `importers/`.
- `infrastructure/` — `repository/` (rusqlite repositories and migrations), `encryption.rs` (at-rest AES-GCM with the OS key store), `stable_hash.rs` (hashes stable across releases and platforms), `macos_api/` (dormant), `windows_api/`, `windows_ext.rs`.
- `domain/models.rs` — shared models such as `ClipboardEntry`; serde field names are the frontend payload contract.
- `app_state.rs` — in-memory state registered with Tauri: `SettingsState` (atomics/mutexes mirroring hot settings), `SessionHistory` (session-only entries, capped at 500), `PasteQueue`, `EncryptionQueueState`, `AppDataDir`. `global_state.rs` holds process globals.
- `database.rs` — opens SQLite, creates/migrates the schema, seeds setting defaults, and exposes `DbState` with `Arc<Mutex<Connection>>`. The lock order is documented there: take `SessionHistory`/`AppDataDir` first, then the connection; never wait for another lock while holding the connection.

Data lives in the app data directory (`clipboard.db`, `attachments/`, `tiez.log`). `datapath.txt` can redirect it, and a `data/` folder next to the executable (portable build) always wins. Sensitive setting keys are encrypted at rest (`SENSITIVE_KEYS` in `database.rs`).

### Settings model

Settings are a `key TEXT PRIMARY KEY, value TEXT` table of strings. Defaults are seeded in `database.rs::seed_defaults`; `CHANGED_DEFAULTS` handles defaults that changed after release (new installs vs upgrades). The frontend loads the whole map with `get_settings`, parses/validates it in `src/shared/hooks/useSettingsPostInit.ts`, and writes changes with `save_setting` or a dedicated `set_*` command. Hot values are mirrored into Rust `SettingsState`; hotkeys and other behavior-changing settings have dedicated commands that also re-register OS state. `settings-changed` events make every window reload.

When adding a setting:

1. seed it in `database.rs` (and `CHANGED_DEFAULTS` if the default changes for existing users);
2. add the Rust behavior/default (and mirror it in `SettingsState` if the capture path reads it);
3. add the frontend fallback/parse in `useSettingsPostInit.ts` and the control in `features/settings/`;
4. keep boolean fallbacks identical on both sides — `src/contracts/settingsDefaults.test.ts` fails otherwise.

### Clipboard capture

Platform listeners signal a change (`clipboard_listener.rs`): Windows uses `WM_CLIPBOARDUPDATE`. A worker thread collapses bursts into one capture of the latest value, then `services/clipboard/pipeline.rs` runs ordered stages: Discovery → Transformation → SequentialEcho → Sound → Deduplication → Persistence → Distribution. The pipeline emits `clipboard-updated` (full entry), `clipboard-removed` (id), and `clipboard-changed` (batch/other changes); the frontend listens in `src/shared/hooks/useClipboardEvents.ts`. Images are stored as content-addressed files under the data directory, with a hash/snapshot in the DB.

### Frontend layout

- `src/App.tsx` is the orchestrator: state, keyboard shortcuts, list/detail split view, and composition. Much of its logic is extracted into hooks.
- `src/shared/hooks/` — cross-feature hooks (settings init/apply, history fetching, clipboard events, navigation, hotkeys, overlays). `src/features/app/hooks/` — app-shell hooks (split view, detail actions). `src/features/*/hooks/` — feature-local.
- `src/features/` — `clipboard/` (list, detail pane, compact preview, pin sticker, drag/drop, preview controls), `settings/`, `emoji/`, `app/` (shell components/types).
- Pure logic lives in `lib/` modules (e.g. `src/shared/lib/*.ts`, `src/features/clipboard/lib/*.ts`) with colocated `.test.ts`; prefer extending these over growing `App.tsx`.
- `src/shared/config/` — the single Mica theme, native palettes. `src/contracts/` — cross-language contract tests, not runtime code.
- Everything must render without Tauri for the e2e harness: guard IPC and event code with `isTauriRuntime()` (`src/shared/lib/tauriRuntime.ts`) and clean up listeners. The harness injects a mock `window.__TAURI_INTERNALS__` and a stateful backend (`e2e/harness/`).

### Styling and themes

`docs/DESIGN-SYSTEM.md` is the rulebook, and `npm run lint:styles` enforces it:

- `src/styles/base.css` holds every token and its light/dark default; `src/styles/themes/*.css` override tokens per theme and mode; `src/styles/components/*.css` describe structure using tokens only.
- Component CSS must not contain raw colors, `!important`, or theme selectors such as `.theme-paper .x`. Theme-specific looks go through component tokens; a genuine exception needs a `/* design-ok: reason */` comment.
- Spacing follows the documented scale; motion uses `--duration-*` and animates `opacity`/`transform`, not layout.
- `src/styles/themes/load.ts` imports the Mica theme, and runtime classes stay `theme-mica` on `<html>` and `<body>`. `src/shared/config/themes.ts` normalizes every theme id to `mica`; the main and preview windows share it.
- `src/styles/contrast.test.ts` resolves theme tokens and enforces the documented contrast ratios; `src/shared/config/themes.test.ts` covers theme/palette migration.

### i18n

`src/locales.ts` contains the `zh`, `en`, and `tw` packs. `src/locales.test.ts` enforces identical key sets and non-empty critical strings, so every new key must be added to all three.

### Platform split

CI builds and tests Windows only. `windows_api/` holds the native code; `macos_api/` remains as dormant `#[cfg(target_os = "macos")]` code that is not compiled on Windows. Keep new behavior behind `#[cfg(target_os = "windows")]` where it touches platform APIs.

## Conventions the tests enforce

- Tauri command names, arguments, and optional parameters (`src/contracts/tauriCommands.test.ts`).
- Boolean setting fallbacks match between Rust and the settings page (`src/contracts/settingsDefaults.test.ts`).
- CSP keeps inline styles working (`src/contracts/csp.test.ts`); do not add a nonce to `style-src`.
- zh/en/tw locale key parity (`src/locales.test.ts`).
- Style rules and visual contrast (`npm run lint:styles`, `src/styles/contrast.test.ts`).
- TypeScript strict mode plus `noUnusedLocals` / `noUnusedParameters` (`tsconfig.json`).

## Further docs

- `docs/DESIGN-SYSTEM.md` — CSS tokens, color roles, spacing, motion, lint rules.
- `docs/THEME-SYSTEM.md` — theme layer model and runtime contract.
- `docs/RELEASES.md` — versioning, beta/stable channels, signing, portable builds (Windows).
- `e2e/README.md` and `e2e/MANUAL-CHECKLIST.md` — browser harness and manual test steps.
- `PROJECT_REVIEW.md` — a dated (2026-07-16) audit; treat it as historical and verify each item against the current code before acting.
