# @extension/database

Shared IndexedDB database singleton for CineGenie Chrome Extension.

## Purpose

This package provides a centralized Dexie database instance that can be used across all extension contexts:
- **new-tab page**: Primary UI for managing scripts, prompts, assets
- **side-panel**: Quick automation interface for prompt execution
- **background service worker**: Can query prompt templates for API calls (via messaging)

## Features

- ✅ Single source of truth for database schema
- ✅ Consistent schema definitions across extension
- ✅ Centralized migration logic
- ✅ Type-safe table interfaces
- ✅ Singleton pattern - same instance everywhere

## Usage

```typescript
import { db, type PromptRecord, type ScriptStory } from '@extension/database';

// Query prompts
const prompts = await db.prompts.toArray();

// Get specific script
const script = await db.scripts.get(scriptId);

// Add new prompt
await db.prompts.add({
  title: 'Horror Script',
  category: 'script-generation',
  prompt: 'Create a scary movie...',
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

## Tables

- `scripts` - Movie script records with three-act structure
- `images` - Generated images linked to scripts
- `videos` - Generated videos linked to scripts  
- `audios` - Generated TTS audio linked to scripts
- `prompts` - Reusable prompt templates with automation settings

## Why Shared Package?

**Before**: Duplicate `db.ts` in new-tab and side-panel
**After**: Single `@extension/database` imported everywhere

Benefits:
1. DRY principle - no duplicate code
2. Schema changes in one place
3. Guaranteed consistency
4. Easier testing and maintenance
