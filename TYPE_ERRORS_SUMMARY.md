# Type Errors Summary - nexo-ext-react

## Completed Fixes ✅

1. **ai-generation-tab.tsx** - Removed extra `language` parameter from `formatFullPromptForClipboard` call
2. **PromptLibrary.tsx** - Added type assertion for `category` field: `as PromptTemplate['category']`
3. **Constants Organization** - Created new organized constant files in `packages/shared/lib/constants/`:
   - `ai-models.ts` - All AI model configurations
   - `ui-options.ts` - Predefined genres, loading messages  
   - `api-config.ts` - API URLs and defaults
   - `responsive.ts` - Breakpoints and media queries

4. **Import Updates** - Updated imports to use `@extension/shared`:
   - `gemini-service.ts`
   - `use-preferences-store.ts`
   - `use-model-settings.ts`
   - `tts-asset.tsx`
   - `scene-asset.tsx`

5. **use-script-generation.ts** - Removed extra parameter from `formatPromptForAutomation` call
6. **scene-asset.tsx** - Fixed VIDEO_LOADING_MESSAGES readonly array type issue

## Remaining Type Errors ❌

### 1. AudioRecord Schema Breaking Change
**Files affected:**
- `pages/new-tab/src/components/script/cards/tts-asset.tsx` (lines 160, 226)
- `pages/new-tab/src/services/repositories/asset-repository.ts` (line 30)

**Issue:** Code uses old schema with `scriptId` field directly on `AudioRecord`. Database v7 removed this field and uses `scriptAssetMappings` table instead.

**Old pattern (broken):**
```typescript
await db.audios.add({ 
  scriptId: updatedScript.id!,  // ❌ scriptId doesn't exist
  data: audioBlob 
});
```

**New pattern (required):**
```typescript
// Step 1: Add audio without scriptId
const audioId = await db.audios.add({
  data: audioBlob,
  uploadSource: 'ai-generated',
  uploadedAt: new Date(),
  mimeType: 'audio/mpeg',
});

// Step 2: Create mapping
await db.scriptAssetMappings.add({
  scriptId: script.id!,
  assetType: 'audio',
  assetId: audioId,
  linkedAt: new Date(),
  role: 'dialogue-audio', // or 'full-script-audio'
});
```

**Action needed:** Update all audio creation code to use the new mapping pattern.

### 2. Asset Repository Type Mismatches
**File:** `pages/new-tab/src/services/repositories/asset-repository.ts` (lines 43, 81)

**Issue:** `ImageRecord` cannot be assigned to `AssetData` type. The repository abstraction may need to be updated to handle the new schema properly.

**Action needed:** Review and update the asset repository abstraction layer.

## Import Order Warnings ⚠️

Several files have import order warnings (`@extension/shared` should come before `@extension/ui`):
- `tts-asset.tsx`
- `scene-asset.tsx`

**Action:** Run `pnpm lint --fix` to auto-fix import order.

## Constants Migration Status

### Migrated to `@extension/shared` ✅
- `DEFAULT_MODELS`
- `AVAILABLE_TEXT_MODELS`
- `AVAILABLE_IMAGE_MODELS`
- `AVAILABLE_VIDEO_MODELS`
- `AVAILABLE_TTS_MODELS`
- `DEFAULT_MODEL_SETTINGS`
- `PREDEFINED_GENRES`
- `VIDEO_LOADING_MESSAGES`
- `SCRIPT_GENERATION_LOADING_MESSAGES`
- `VBEE_API_BASE_URL`
- `VBEE_PROJECT_URL`
- `DEFAULT_ASPECT_RATIO`
- `DEFAULT_IMAGE_NEGATIVE_PROMPT`
- `BREAKPOINTS`
- `QUERIES`

### Remaining in local constants (intentional) ✅
- `pages/new-tab/src/constants/script-generation.ts`:
  - `FORM_STORAGE_KEYS` - UI-specific
  - `ERROR_MESSAGES` - UI-specific
  - `SUCCESS_MESSAGES` - UI-specific
  - `AUTOMATE_STORAGE_KEY` - UI-specific
  - `AUTOMATE_DATA_TTL` - UI-specific

## Next Steps

1. **Critical:** Fix AudioRecord schema usage (breaking change from DB v7)
   - Update `tts-asset.tsx`
   - Update `asset-repository.ts`
   - Update any other files that create audio records

2. **High Priority:** Fix asset repository type mismatches

3. **Low Priority:** Run lint --fix to clean up import ordering

4. **Optional:** Consider deprecating/removing old `pages/new-tab/src/constants/index.ts` after verifying all imports are updated
