# Copilot / AI Assistant Instructions for nexo-ext-react

This file is a short, action-oriented guide for AI coding assistants working in this repository. Focus on making small, well-tested changes, and prefer conservative edits that match the repo's existing patterns.

Keep changes scoped and verified with the project's lint/typecheck tooling. If you make edits that touch runtime logic (db operations, assets, stores), run the package's linter and type-check commands locally and report the results.

---

Key project facts

- **Monorepo**: pnpm workspaces + Turbo (`pnpm-workspace.yaml`, `turbo.json`)
- **Chrome Extension MV3**: Background service worker architecture with message-passing
- **Primary app**: `pages/new-tab/` - AI-powered movie script generator using Gemini API
- **Tech stack**: React 19, TypeScript 5.8, Vite 6, Tailwind CSS, shadcn/ui components
- **State management**: Zustand with persist middleware + IndexedDB via Dexie wrapper
- **AI Integration**: Google GenAI SDK (`@google/genai`) for Gemini, Imagen, Veo APIs
- **Styling**: Tailwind CSS with shared config in `packages/tailwindcss-config`

---

Architecture & data flow highlights

**Background Service Worker Pattern (Critical)**:
- UI pages CANNOT directly call external APIs due to Chrome extension security model
- ALL API calls (Gemini, Vbee TTS) are proxied through `chrome-extension/src/background/`
- Message protocol: `pages/new-tab` → `chrome.runtime.sendMessage()` → `background/router.ts` → handler
- Type-safe messaging: see `chrome-extension/src/background/types/messages.ts` for all message types
- Frontend wrapper: `pages/new-tab/src/services/background-api.ts` provides typed methods

**State & Data Flow**:
- **IndexedDB** (via Dexie): `db.scripts`, `db.images`, `db.videos`, `db.audios` for persistent storage
- **Zustand stores**: `useScriptsStore` (canonical script state), `usePreferencesStore` (UI settings), `useApiKey` (secure storage)
- **Store pattern**: Use `produce` from immer for immutable updates, persist critical state with `zustand/middleware`
- **Event-driven updates**: Dispatch `window.dispatchEvent(new CustomEvent('assets-changed'))` when assets change so gallery auto-refreshes
- **No prop-drilling**: Large state (scripts, assets) should live in stores, not component props

**Key architectural decisions**:
- Scripts use three-act structure with nested acts/scenes/dialogues (see `types.ts`)
- Each scene can have generated image/video/audio linked by ID (not embedded)
- Narrator character with roleId 'narrator' MUST exist for scenes without dialogue (TTS requirement)
- Assets stored as Blobs in IndexedDB (previously base64, migrated for performance)

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

UI Design System & Component Patterns

**shadcn/ui Component Library** (`packages/ui`):
- **Base**: Built on Radix UI primitives + Tailwind CSS + class-variance-authority (CVA)
- **Style**: "new-york" preset with zinc color scheme, CSS variables for theming
- **Theme system**: next-themes for light/dark mode, CSS variables in `global.css`
- **Component structure**: All UI components in `packages/ui/lib/components/ui/`
- **Import pattern**: `import { Button, Card, Dialog } from '@extension/ui';`

**Design Tokens** (CSS Variables):
```css
/* Light mode: --background, --foreground, --primary, --secondary, etc. */
/* Dark mode: Automatic via .dark class with different HSL values */
/* Custom scrollbar: Styled for both light/dark modes */
```

**Component Variants** (using CVA):
- Button: `default | destructive | outline | secondary | ghost | link`
- Sizes: `default | sm | lg | icon`
- Always use semantic variants (don't hardcode colors)
- Example: `<Button variant="destructive" size="sm">Delete</Button>`

**Styling Conventions**:
- **Prefer UI components** over custom styled divs
- **Composition pattern**: Card = CardHeader + CardTitle + CardDescription + CardContent + CardFooter + CardAction
- **Utility-first**: Use Tailwind utilities (`flex`, `gap-2`, `rounded-xl`) for layout
- **Semantic HTML**: Use proper elements (`<button>`, `<label>`, `<fieldset>`)
- **No inline styles**: Always use className with Tailwind utilities
- **Color consistency**: Use CSS variable colors (`text-muted-foreground`, `bg-card`, `border-border`)

**Component Usage Best Practices**:
```tsx
// ✅ Good: Use UI components with variants
import { Button, Card, CardHeader, CardTitle, CardContent } from '@extension/ui';

<Card>
  <CardHeader>
    <CardTitle>Script Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="outline" size="sm">Edit</Button>
  </CardContent>
</Card>

// ❌ Bad: Custom styled divs with inline colors
<div style={{ backgroundColor: '#fff', borderRadius: '8px' }}>
  <button className="bg-blue-500">Edit</button>
</div>
```

**Accessibility**:
- All interactive elements use Radix UI for keyboard navigation, focus management, ARIA attributes
- Use `<Label>` from UI package for form fields
- Dialog/AlertDialog automatically trap focus and handle escape key

**Responsive Design**:
- Mobile-first approach with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- Container sizing controlled by `usePreferencesStore` (compact/comfortable/spacious)
- See `ContainerWrapper.tsx` for dynamic container width implementation

**Icon Library**:
- Primary: lucide-react (specified in components.json)
- Import: `import { Edit, Trash2, Download } from 'lucide-react';`
- Sizing: Icons auto-size to `size-4` within Button components via `[&_svg]:size-4`

---

Patterns & conventions to follow

- Exports & import order: ESLint rules are strict — prefer named exports, keep types imported with `import type` where possible, and keep import order consistent.
- No `any`: Replace `any` with concrete types or use `unknown` then narrow. The linter enforces `@typescript-eslint/no-explicit-any`.
- Small helper functions: utilities that mutate nested objects commonly use `setNestedValue(obj, path, value)` pattern (see `useScriptsStore.ts`). Keep these pure-ish and well-typed.
- Error messages and UI text sometimes use Vietnamese strings — preserve locale in user-visible strings unless intentionally changing UX.
- IndexedDB usage: use the `db` wrapper methods (`toArray`, `add`, `put`, `delete`, `where(...).delete`) and ensure to clear dependent assets on script delete.

---

Files of interest (quick map)

**Chrome Extension Background (Critical for API calls)**:
- chrome-extension/src/background/
  - router.ts — Message router mapping types to handlers
  - gemini-api-handler.ts — Gemini/Imagen/Veo API handlers (uses @google/genai SDK)
  - vbee-api-handler.ts — Vbee TTS API handler
  - settings-handler.ts — API key and model settings management
  - types/messages.ts — Type-safe message protocol (BackgroundMessage/BackgroundResponse unions)
  - schemas/script-schema.ts — JSON schemas using Type enum for structured generation

**Frontend (New Tab Page)**:
- pages/new-tab/src/
  - App.tsx — Top-level entry (mounts stores, handles import/export/zip)
  - NewTab.tsx — React Router HashRouter + Routes (Scripts, AssetGallery pages)
  - db.ts — IndexedDB wrapper (Dexie) used across app
  - services/background-api.ts — **Frontend wrapper for background communication** (sendMessage, unwrapResponse)
  - stores/useScriptsStore.ts — Canonical zustand store for scripts (init, add, save, delete)
  - stores/usePreferencesStore.ts — UI preferences (theme, containerSize, compactMode)
  - stores/useApiKey.ts — API key storage with persist middleware
  - hooks/use-assets.ts — Asset generation hooks (image, video, audio)
  - components/* — UI components: AssetDisplay, AssetGallery, ScriptDisplay, ScriptHeader, CreationForm

**Shared Packages**:
- packages/ui — Shared shadcn/ui components (Button, Dialog, Card, etc.)
- packages/shared — Common utilities and types
- packages/tailwindcss-config — Shared Tailwind configuration

---

Common pitfalls & quick fixes

- **API calls in UI pages will fail silently**: NEVER call external APIs directly from UI pages. Always use `pages/new-tab/src/services/background-api.ts` methods which proxy through background service worker.
- **Message protocol types**: When adding new API calls, update `chrome-extension/src/background/types/messages.ts` with new message/response types, add handler in appropriate file, register in `router.ts`.
- Malformed or duplicate files (esp. store files) cause TypeScript parse errors that cascade into many lint errors. If you see "Parsing error: ';' expected" inspect the file for duplicated content or stray backticks.
- After editing a store, re-run `pnpm -w -C pages/new-tab lint` — many consumers import the store and will fail to parse if the store doesn't compile.
- Remember to dispatch `assets-changed` after deleting assets or clearing DB so galleries update.
- **Schema definitions**: Use `Type` enum from `@google/genai` (not JSON.parse) for structured generation schemas in `background/schemas/`.
- **Zustand updates**: Always use `produce` from immer for nested state updates in stores to maintain immutability.

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
