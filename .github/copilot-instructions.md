# Copilot / AI Assistant Instructions for nexo-ext-react

This file is a short, action-oriented guide for AI coding assistants working in this repository. Focus on making small, well-tested changes, and prefer conservative edits that match the repo's existing patterns.

Keep changes scoped and verified with the project's lint/typecheck tooling. If you make edits that touch runtime logic (db operations, assets, stores), run the package's linter and type-check commands locally and report the results.

---

Key project facts

- Monorepo with pnpm + turbo: repo root contains `pnpm-workspace.yaml` and `turbo.json`.
- Primary frontend is a Chrome extension-like UI under `pages/new-tab/` and other packages like `devtools`, `new-tab`, `popup`, etc.
- UI uses React + TypeScript and small shared packages under `packages/*`.
- State: local IndexedDB wrapper `db` (see `pages/*/src/db`) and some centralized stores implemented with `zustand` (e.g. `pages/new-tab/src/stores/useScriptsStore.ts`).
- Styling: Tailwind CSS is used across packages (see `tailwind.config.ts` files).

---

Architecture & data flow highlights

- The "new-tab" app is the primary workspace for script and asset management. Scripts are persisted to IndexedDB via a `db` wrapper exposing `db.scripts`, `db.images`, `db.videos`.
- Components should not prop-drill large script state. A `zustand` store (`useScriptsStore`) is the canonical place for script state and actions (init, add, save, delete, clear, update fields).
- Asset lifecycle: generated images/videos are stored in `db.images` and `db.videos`. When assets are added/removed or scripts deleted, code dispatches a global event: `window.dispatchEvent(new CustomEvent('assets-changed'))` — consumers like the gallery listen to this to refresh.
- The codebase respects modular packages under `packages/` and `pages/` — prefer editing the specific package when possible and run lint/type-check for that package.

---

Developer workflows & useful commands

- Install & workspace commands: pnpm is the package manager. Use pnpm from repo root.
- Lint/check for a package (e.g. `new-tab`):

  pnpm -w -C pages/new-tab lint
  pnpm -w -C pages/new-tab type-check

- Run the entire monorepo dev (if configured):

  pnpm -w dev

- When changing stores or DB usage, run the package lint & type-check immediately to catch parse errors quickly.

---

Patterns & conventions to follow

- Exports & import order: ESLint rules are strict — prefer named exports, keep types imported with `import type` where possible, and keep import order consistent.
- No `any`: Replace `any` with concrete types or use `unknown` then narrow. The linter enforces `@typescript-eslint/no-explicit-any`.
- Small helper functions: utilities that mutate nested objects commonly use `setNestedValue(obj, path, value)` pattern (see `useScriptsStore.ts`). Keep these pure-ish and well-typed.
- Error messages and UI text sometimes use Vietnamese strings — preserve locale in user-visible strings unless intentionally changing UX.
- IndexedDB usage: use the `db` wrapper methods (`toArray`, `add`, `put`, `delete`, `where(...).delete`) and ensure to clear dependent assets on script delete.

---

Files of interest (quick map)

- pages/new-tab/src/
  - App.tsx — top-level NewTab entry (mounts stores, handles import/export/zip)
  - db.ts — IndexedDB wrapper used across the app
  - stores/useScriptsStore.ts — canonical zustand store for scripts (init, add, save, delete)
  - components/* — UI components: AssetDisplay, AssetGallery, ScriptDisplay, ScriptHeader, CreationForm
  - services/geminiService.ts — AI script generation helper

- packages/* — shared UI components and utilities used across pages (see `@extension/ui`, `@extension/shared` references in code)

---

Common pitfalls & quick fixes

- Malformed or duplicate files (esp. store files) cause TypeScript parse errors that cascade into many lint errors. If you see "Parsing error: ';' expected" inspect the file for duplicated content or stray backticks.
- After editing a store, re-run `pnpm -w -C pages/new-tab lint` — many consumers import the store and will fail to parse if the store doesn't compile.
- Remember to dispatch `assets-changed` after deleting assets or clearing DB so galleries update.

---

When to ask for clarification

- If the change touches cross-package public APIs (packages/*), ask before rearranging exports.
- If you need to modify UX text in Vietnamese, confirm if locale files or localization strategy should be updated.

---

If you modify or add tests

- Run package-level type-check and lint. There is no single test runner configured that we can rely on; prefer small type-safe unit tests in the package where appropriate.

---

Need more info?

If anything above is unclear, point to the file you want to change and I'll fetch the minimal surrounding files and note exactly which commands to run to validate changes.
