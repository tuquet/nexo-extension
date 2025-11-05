# Constants Consolidation Summary

## Objective
Consolidate ALL duplicate constants from `pages/new-tab/src/constants/` to `packages/shared/lib/constants/` to establish a single source of truth for the entire monorepo.

## Changes Made

### 1. Deleted Files
- ❌ `pages/new-tab/src/constants/script-generation.ts` - All constants moved to shared

### 2. Modified Files

#### `packages/shared/lib/constants/ui-options.ts`
**Added constants from script-generation.ts:**
- `FORM_STORAGE_KEYS` - Form field storage keys for persistence
- `ERROR_MESSAGES` - User-facing error messages
- `SUCCESS_MESSAGES` - User-facing success confirmations
- `AUTOMATE_STORAGE_KEY` - Key for automation data storage
- `AUTOMATE_DATA_TTL` - TTL for automation data (10 seconds)

#### `pages/new-tab/src/constants/index.ts`
**Before:** 120+ lines of duplicate constants
**After:** 35 lines of re-exports from @extension/shared

**Removed duplicates:**
- `DEFAULT_MODELS` → now from `@extension/shared/lib/constants/ai-models`
- `AVAILABLE_TEXT_MODELS` → now from `@extension/shared/lib/constants/ai-models`
- `AVAILABLE_IMAGE_MODELS` → now from `@extension/shared/lib/constants/ai-models`
- `AVAILABLE_VIDEO_MODELS` → now from `@extension/shared/lib/constants/ai-models`
- `AVAILABLE_TTS_MODELS` → now from `@extension/shared/lib/constants/ai-models`
- `PREDEFINED_GENRES` → now from `@extension/shared/lib/constants/ui-options`
- `VIDEO_LOADING_MESSAGES` → now from `@extension/shared/lib/constants/ui-options`
- `SCRIPT_GENERATION_LOADING_MESSAGES` → now from `@extension/shared/lib/constants/ui-options`
- `DEFAULT_ASPECT_RATIO` → now from `@extension/shared/lib/constants/api-config`
- `DEFAULT_IMAGE_NEGATIVE_PROMPT` → now from `@extension/shared/lib/constants/api-config`
- `VBEE_API_BASE_URL` → now from `@extension/shared/lib/constants/api-config`
- `VBEE_PROJECT_URL` → now from `@extension/shared/lib/constants/api-config`
- `BREAKPOINTS` → now from `@extension/shared/lib/constants/responsive`
- `QUERIES` → now from `@extension/shared/lib/constants/responsive`

### 3. Updated Imports

**Files with updated imports to use @extension/shared:**
- ✅ `pages/new-tab/src/hooks/use-script-generation.ts`
  - `ERROR_MESSAGES`, `SUCCESS_MESSAGES` → from `@extension/shared/lib/constants/ui-options`
- ✅ `pages/new-tab/src/hooks/use-async-operation.ts`
  - `ERROR_MESSAGES` → from `@extension/shared/lib/constants/ui-options`
- ✅ `pages/new-tab/src/utils/prompt-builder.ts`
  - `DEFAULT_MODEL_SETTINGS` → from `@extension/shared/lib/constants/ai-models`
- ✅ `pages/new-tab/src/components/script/generation/ai-generation-tab.tsx`
  - `FORM_STORAGE_KEYS` → from `@extension/shared/lib/constants/ui-options`

**Files using backward-compatible re-exports (no changes needed):**
- `pages/new-tab/src/components/script/modals/tts-export.tsx` - `AVAILABLE_TTS_MODELS`
- `pages/new-tab/src/components/script/settings/model-settings.tsx` - All model constants
- `pages/new-tab/src/components/script/generation/generation-form.tsx` - `SCRIPT_GENERATION_LOADING_MESSAGES`
- `pages/new-tab/src/components/script/settings/advanced-model-options.tsx` - Model constants
- `pages/new-tab/src/components/script/display/responsive-detail-layout.tsx` - `QUERIES`
- `pages/new-tab/src/components/script/display/asset-display.tsx` - `DEFAULT_IMAGE_NEGATIVE_PROMPT`

### 4. Type Fixes

**Fixed TypeScript errors caused by `as const` narrowing:**
- ✅ `pages/new-tab/src/components/script/generation/generation-form.tsx`
  - Added explicit type annotation for `loadingMessage` state: `(typeof SCRIPT_GENERATION_LOADING_MESSAGES)[number]`
- ✅ `pages/new-tab/src/components/script/settings/model-settings.tsx`
  - Removed unnecessary `AVAILABLE_TTS_MODELS.length === 0` check (TypeScript knows length is 8)

## Final Constants Structure

```
packages/shared/lib/constants/
├── ai-models.ts              # AI model configurations, settings
├── ai-prompts.ts             # System instructions for AI
├── api-config.ts             # External API URLs, defaults
├── prompt-categories.ts      # Prompt template categories
├── responsive.ts             # Breakpoints, media queries
└── ui-options.ts             # UI constants (genres, messages, storage keys)
```

## Validation

### Type-Check Results
- ✅ `@extension/shared` - PASS (no errors)
- ✅ `@extension/new-tab` - PASS (no errors)
- ✅ `@extension/options` - PASS (no errors)

### Lint Results
- ✅ `@extension/new-tab` - PASS (3 unrelated React hooks warnings)

## Benefits

1. **Single Source of Truth**: All constants now live in `@extension/shared`
2. **No Duplication**: Removed 100+ lines of duplicate constants
3. **Backward Compatible**: Re-exports in `pages/new-tab/src/constants/index.ts` prevent breaking changes
4. **Type Safety**: All constants use `as const` for literal type inference
5. **Better Organization**: Constants grouped by domain (AI, API, UI, responsive)
6. **Easier Maintenance**: Changes to constants only need to be made in one place

## Migration Path

**For new code:**
```typescript
// ✅ Good: Direct import from shared
import { DEFAULT_MODELS } from '@extension/shared/lib/constants/ai-models';
import { ERROR_MESSAGES } from '@extension/shared/lib/constants/ui-options';
```

**For existing code (backward compatible):**
```typescript
// ✅ Still works: Re-exports from new-tab constants
import { DEFAULT_MODELS, ERROR_MESSAGES } from '@src/constants';
```

**Future improvement:**
- Consider migrating all `@src/constants` imports to direct `@extension/shared` imports
- This would allow complete removal of `pages/new-tab/src/constants/index.ts`

## Notes

- `pages/new-tab/src/constants/index.ts` is now marked as **DEPRECATED** with clear documentation
- Developers are instructed to use `@extension/shared` for all new code
- No runtime breaking changes - all exports are maintained
- TypeScript strictness improved with `as const` assertions
