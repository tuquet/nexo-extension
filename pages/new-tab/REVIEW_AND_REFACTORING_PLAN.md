# New-Tab Page - Code Review & Refactoring Analysis

## 📊 EXECUTIVE SUMMARY

**Current State**: Functional but có nhiều code smells và violations of SOLID principles
**Lines of Code**: ~3,000+ lines
**Main Issues**: 
- Massive components (127-592 lines)
- Props drilling
- Business logic in components
- Duplicate code
- Tight coupling
- Mixed concerns

**Recommendation**: Refactor theo phương pháp tương tự background service worker

---

## 🎨 1. REVIEW GIAO DIỆN (UI/UX STRUCTURE)

### ✅ Strengths

1. **Component Organization** - Folder structure hợp lý:
   ```
   components/script/
   ├── actions/     # Action buttons
   ├── cards/       # List items
   ├── display/     # Read-only views
   ├── forms/       # Input forms
   ├── generation/  # AI generation UI
   ├── modals/      # Dialogs
   ├── settings/    # Configuration
   └── ui/          # Reusable primitives
   ```

2. **Responsive Design** - Có responsive breakpoints và adaptive layouts
3. **Theme Support** - Dark/light mode với ThemeProvider
4. **UI Components** - Sử dụng shadcn/ui consistently

### ❌ Issues

#### Issue 1: Duplicate Loading Spinners
**Location**: Multiple files
```tsx
// ❌ BAD: Inline loading UI repeated everywhere
{isLoading && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80">
    <div className="h-12 w-12 animate-spin rounded-full border-4..."></div>
    <h4 className="mt-6 text-lg font-semibold text-white">Loading...</h4>
  </div>
)}
```

**Found in**: 
- `pages/script/detail.tsx` (lines 101-108)
- `components/script/modals/tts-export.tsx`
- `components/script/forms/create-form.tsx`

**Impact**: ~50 lines duplicated code
**Solution**: Create `<FullScreenLoader />` component

---

#### Issue 2: No Design System Documentation
**Problem**: Hard-coded colors, spacing values không consistent
```tsx
// ❌ BAD: Magic numbers và hard-coded values
className="mt-6 text-lg"           // mt-6 ở đây
className="mt-4 text-lg"           // mt-4 ở kia (inconsistent)
className="text-slate-600"         // Hard-coded color
```

**Solution**: 
- Create spacing tokens (`spacing-xs`, `spacing-sm`, etc.)
- Use CSS variables consistently
- Document design tokens

---

#### Issue 3: Accessibility Issues
**Problems**:
1. Missing ARIA labels on icon buttons
2. Keyboard navigation không đầy đủ
3. Focus management trong modals chưa tốt

```tsx
// ❌ BAD: No accessible name
<Button onClick={...}>
  <Play className="h-4 w-4" />
</Button>

// ✅ GOOD: With accessible name
<Button onClick={...} aria-label="Play audio">
  <Play className="h-4 w-4" />
</Button>
```

---

## 🏗️ 2. REVIEW COMPONENT ARCHITECTURE

### ❌ CRITICAL ISSUE: God Components (Single Responsibility Violation)

#### Problem 1: `use-scripts-store.ts` - 592 lines
**Responsibilities** (should be 1, has 10+):
1. ✗ Script state management
2. ✗ Scene state management  
3. ✗ Modal state management
4. ✗ Import/Export logic
5. ✗ Zip creation logic
6. ✗ Database operations
7. ✗ Form state
8. ✗ View mode state
9. ✗ Error handling
10. ✗ JSON parsing

**SOLID Violation**: Single Responsibility Principle ❌

**Refactoring Plan**:
```typescript
// ✅ Split into focused stores
stores/
├── use-scripts-store.ts        // ONLY script CRUD (150 lines)
├── use-scene-navigation.ts     // Active scene selection (50 lines)
├── use-modal-state.ts          // Modal open/close (30 lines)
├── use-import-export.ts        // Import/Export logic (80 lines)
└── use-view-preferences.ts     // View modes, UI state (40 lines)

// ✅ Extract services
services/
├── script-repository.ts        // DB operations
├── zip-service.ts              // Zip creation
└── json-parser.ts              // Validation
```

**Impact**: Reduce from 592 → ~350 lines total (better organized)

---

#### Problem 2: `pages/script/detail.tsx` - 127 lines
**Responsibilities** (should be 1, has 6):
1. ✗ Routing logic
2. ✗ State synchronization
3. ✗ Modal management
4. ✗ Error handling
5. ✗ Layout rendering
6. ✗ Asset management initialization

```tsx
// ❌ BAD: Too many concerns in one component
const ScriptDetailPage = () => {
  // 1. Routing
  const { id } = useParams();
  
  // 2. State sync
  useEffect(() => { selectScript(...) }, [id]);
  
  // 3. Modal state
  const [isTtsModalOpen, setIsTtsModalOpen] = useState(false);
  
  // 4. Error handling
  const [error, setError] = useState<string | null>(null);
  
  // 5. Asset init
  void useAssets(setError);
  
  // 6. Rendering logic
  return <div>... 100 lines of JSX ...</div>;
};
```

**Refactoring Plan**:
```tsx
// ✅ GOOD: Separation of concerns
// hooks/use-script-route-sync.ts
const useScriptRouteSync = (id: string | undefined) => {
  const hasHydrated = useStoreHydration();
  const selectScript = useScriptsStore(s => s.selectScript);
  
  useEffect(() => {
    if (hasHydrated && id) selectScript(parseInt(id, 10));
  }, [id, hasHydrated, selectScript]);
  
  return { isSyncing: !hasHydrated || ... };
};

// pages/script/detail.tsx (50 lines)
const ScriptDetailPage = () => {
  const { id } = useParams();
  const { isSyncing } = useScriptRouteSync(id);
  const activeScript = useScriptsStore(s => s.activeScript);
  
  if (isSyncing) return <LoadingSpinner />;
  if (!activeScript) return <NoScriptFallback />;
  
  return (
    <ScriptDetailLayout>
      <ScriptHeader />
      <ScriptModals />
      <ResponsiveDetailLayout ... />
    </ScriptDetailLayout>
  );
};
```

**Impact**: 127 lines → 50 lines (page) + 30 lines (hook) + extracted components

---

#### Problem 3: `components/script/display/content.tsx` - 153 lines
**Responsibilities** (should be 1, has 5):
1. ✗ JSON editing
2. ✗ JSON validation
3. ✗ Script rendering
4. ✗ Scene navigation
5. ✗ Field updates

**SOLID Violation**: Multiple responsibilities + Open/Closed ❌

```tsx
// ❌ BAD: Mixed presentation and logic
const ScriptContent = ({ script, viewMode }) => {
  const [jsonText, setJsonText] = useState(...);
  const [jsonError, setJsonError] = useState(...);
  const textareaRef = useRef(...);
  
  // JSON editing logic (should be separate)
  const handleSaveJson = async () => { ... };
  
  // Formatting logic
  useEffect(() => {
    textareaRef.current.style.height = ...;
  }, [jsonText]);
  
  // Presentation logic
  if (viewMode === 'json') return <JsonEditor ... />;
  return <FormattedScript ... />;
};
```

**Refactoring Plan**:
```tsx
// ✅ Split into focused components
components/script/display/
├── script-content.tsx          // Router component (20 lines)
├── formatted-script-view.tsx   // Read-only display (80 lines)
└── json-editor-view.tsx        // JSON editing (50 lines)

// script-content.tsx
const ScriptContent = ({ script, viewMode }) => {
  if (viewMode === 'json') {
    return <JsonEditorView script={script} />;
  }
  return <FormattedScriptView script={script} />;
};
```

---

### ❌ ISSUE: Props Drilling (Dependency Inversion Violation)

#### Problem: Deep props passing
**Location**: `content.tsx` → `Scene` → `InfoPill` → `EditableField`

```tsx
// ❌ BAD: Props drilling 4 levels deep
<ScriptContent language="vi-VN" /> 
  → <Scene language={language} />
    → <InfoPill language={language} />
      → <EditableField language={language} />
```

**Files affected**: 
- `content.tsx` (passes language)
- `scene.tsx` (passes language)
- `editable-field.tsx` (uses language)

**Solution**: Use context or store
```tsx
// ✅ GOOD: Use LanguageContext
// contexts/language-context.tsx
const LanguageContext = createContext<'en-US' | 'vi-VN'>('vi-VN');

// Any component can access directly
const EditableField = () => {
  const language = useContext(LanguageContext);
  // No props drilling!
};
```

---

### ❌ ISSUE: Tight Coupling (Dependency Inversion Violation)

#### Problem 1: Components directly import DB
**Location**: `components/script/cards/scene.tsx`

```tsx
// ❌ BAD: UI component directly depends on concrete DB
import { db } from '@src/db';

const Scene = () => {
  useEffect(() => {
    const loadImage = async () => {
      const imageRecord = await db.images.get(scene.generatedImageId);
      // Direct database access in UI component!
    };
  }, []);
};
```

**SOLID Violation**: Dependency Inversion ❌
**Impact**: Component can't be tested without real database

**Solution**:
```tsx
// ✅ GOOD: Depend on abstraction
// hooks/use-scene-image.ts
export const useSceneImage = (imageId: number | undefined) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!imageId) return;
    
    const loadImage = async () => {
      // Repository pattern hides DB implementation
      const url = await imageRepository.getImageUrl(imageId);
      setImageUrl(url);
    };
    
    loadImage();
  }, [imageId]);
  
  return imageUrl;
};

// components/script/cards/scene.tsx
const Scene = ({ scene }) => {
  const imageUrl = useSceneImage(scene.generatedImageId);
  // No direct DB dependency!
};
```

---

#### Problem 2: Hook directly calls background API
**Location**: `hooks/use-assets.ts` (243 lines)

```tsx
// ❌ BAD: Hook does too much
import { generateSceneImage as backgroundGenerateSceneImage } from '../services/background-api';

export const useAssets = (setError) => {
  const generateSceneImage = async (...args) => {
    // 1. Clone script
    const working = clone(script);
    
    // 2. Update UI state
    working.acts[actIndex].scenes[sceneIndex].isGeneratingImage = true;
    useScriptsStore.getState().setActiveScript(working);
    
    // 3. Call API
    const { imageUrl } = await backgroundGenerateSceneImage({...});
    
    // 4. Store in DB
    const imgBlob = dataUrlToBlob(imageUrl);
    const imageId = await db.images.add({ data: imgBlob, scriptId });
    
    // 5. Update state again
    await useScriptsStore.getState().saveActiveScript(updated);
  };
};
```

**Responsibilities**: 8 different things! ❌

**Refactoring Plan**:
```typescript
// ✅ GOOD: Service layer pattern
// services/asset-generation-service.ts
class AssetGenerationService {
  async generateSceneImage(params: GenerateImageParams) {
    const { imageUrl } = await backgroundGenerateSceneImage(params);
    const blob = dataUrlToBlob(imageUrl);
    return await imageRepository.save(blob, params.scriptId);
  }
}

// hooks/use-generate-image.ts (30 lines)
export const useGenerateImage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generate = async (params: GenerateImageParams) => {
    setIsGenerating(true);
    try {
      const imageId = await assetGenerationService.generateSceneImage(params);
      return imageId;
    } catch (e) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return { generate, isGenerating, error };
};

// Component usage (clean!)
const ImageGenerationButton = () => {
  const { generate, isGenerating } = useGenerateImage();
  
  return (
    <Button 
      onClick={() => generate({...})} 
      disabled={isGenerating}
    >
      Generate
    </Button>
  );
};
```

---

## ⚙️ 3. REVIEW BUSINESS LOGIC & SERVICES

### ❌ CRITICAL: No Service Layer

**Problem**: Business logic scattered across:
- Stores (592 lines)
- Hooks (243 lines)
- Components (100+ lines each)

**Missing abstractions**:
```
❌ No ScriptRepository (DB operations)
❌ No AssetService (image/video/audio generation)
❌ No ExportService (JSON/ZIP export)
❌ No ValidationService (dialogue validation)
❌ No StorageService (localStorage/IndexedDB abstraction)
```

**Consequence**: 
- Hard to test
- Duplicate code
- Tight coupling
- Hard to change

---

### ❌ ISSUE: services/background-api.ts

**Current State**: Simple message passing wrapper (good!)
```typescript
// ✅ This part is GOOD
export const generateSceneImage = async (params) => {
  return sendMessage({
    type: 'GENERATE_SCENE_IMAGE',
    payload: params
  });
};
```

**BUT**: Missing error handling, retry logic, timeout

**Enhancement Needed**:
```typescript
// ✅ Better version with resilience
export class BackgroundAPIClient {
  async generateSceneImage(
    params: GenerateImageParams,
    options?: { timeout?: number; retries?: number }
  ): Promise<GenerateImageResponse> {
    return this.sendWithRetry(
      { type: 'GENERATE_SCENE_IMAGE', payload: params },
      options
    );
  }
  
  private async sendWithRetry<T>(
    message: BackgroundMessage,
    options?: RetryOptions
  ): Promise<T> {
    const timeout = options?.timeout ?? 30000;
    const retries = options?.retries ?? 3;
    
    for (let i = 0; i < retries; i++) {
      try {
        return await this.sendWithTimeout(message, timeout);
      } catch (error) {
        if (i === retries - 1) throw error;
        await delay(1000 * Math.pow(2, i)); // Exponential backoff
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

---

### ❌ ISSUE: utils/dialogue-validator.ts

**Current State**: Pure utility functions (good!)

**BUT**: Should be a service with configuration:
```typescript
// ❌ Current: Hard-coded rules
export const validateDialogueLine = (line: string) => {
  const hasStageDirection = /\(.*?\)/.test(line);
  const hasBracketedNote = /\[.*?\]/.test(line);
  // ...
};

// ✅ Better: Configurable service
export class DialogueValidator {
  constructor(private config: ValidationConfig) {}
  
  validate(line: string): ValidationResult {
    const rules = [
      new StageDirectionRule(this.config),
      new BracketNoteRule(this.config),
      new EmptyLineRule(this.config),
    ];
    
    const errors = rules
      .map(rule => rule.validate(line))
      .filter(Boolean);
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

**Benefits**:
- Easy to add new rules
- Configurable per user/script
- Testable in isolation
- Open/Closed principle ✅

---

## 📋 REFACTORING PRIORITIES

### Phase 1: Extract Services (High Impact, Low Risk)
**Duration**: 2-3 days
**Files to create**: ~8 service files (~800 lines total)

```
services/
├── repositories/
│   ├── script-repository.ts      # DB operations for scripts
│   ├── asset-repository.ts       # DB operations for assets
│   └── prompt-repository.ts      # DB operations for prompts
├── asset-generation-service.ts   # Image/Video/Audio generation
├── export-service.ts             # JSON/ZIP export
├── validation-service.ts         # Dialogue validation
└── storage-service.ts            # localStorage/IndexedDB wrapper
```

**Benefits**:
- ✅ Testable business logic
- ✅ Reusable across components
- ✅ Easy to mock
- ✅ Follows Dependency Inversion

---

### Phase 2: Split God Store (High Impact, Medium Risk)
**Duration**: 1-2 days
**Files to refactor**: 1 file (592 lines → 5 files, ~350 lines)

```
stores/
├── use-scripts-store.ts          # ONLY CRUD (150 lines)
├── use-scene-navigation.ts       # Active scene (50 lines)
├── use-modal-state.ts            # Modals (30 lines)
├── use-import-export.ts          # Import/Export (80 lines)
└── use-view-preferences.ts       # UI state (40 lines)
```

**Benefits**:
- ✅ Single Responsibility
- ✅ Easier to understand
- ✅ Better performance (less re-renders)
- ✅ Easier to test

---

### Phase 3: Extract Hooks (Medium Impact, Low Risk)
**Duration**: 2 days
**Files to create**: ~10 focused hooks

```
hooks/
├── use-script-route-sync.ts      # Route ↔ state sync
├── use-generate-image.ts         # Image generation
├── use-generate-video.ts         # Video generation
├── use-scene-image.ts            # Load image from DB
├── use-scene-video.ts            # Load video from DB
└── use-json-editor.ts            # JSON editing logic
```

**Benefits**:
- ✅ Reusable logic
- ✅ Testable in isolation
- ✅ Clean components

---

### Phase 4: Refactor Large Components (High Impact, Medium Risk)
**Duration**: 3-4 days
**Files to refactor**: ~5 large components

**Targets**:
1. `pages/script/detail.tsx` (127 → 50 lines)
2. `components/script/display/content.tsx` (153 → 80 lines)
3. `components/script/modals/tts-export.tsx` (300+ → 150 lines)
4. `components/script/cards/scene.tsx` (243 → 100 lines)
5. `hooks/use-assets.ts` (243 → 100 lines)

---

### Phase 5: Add Context for Props Drilling (Low Impact, Low Risk)
**Duration**: 1 day

```tsx
// contexts/
├── language-context.tsx
├── script-context.tsx
└── asset-context.tsx
```

---

### Phase 6: UI System Improvements (Medium Impact, Low Risk)
**Duration**: 2 days

1. Create shared loading components
2. Extract inline styles to design tokens
3. Add accessibility improvements
4. Create Storybook documentation

---

## 📊 IMPACT ANALYSIS

### Code Reduction
- **Current**: ~3,000+ lines
- **After Refactor**: ~2,200 lines
- **Reduction**: 27% (800 lines removed via deduplication)

### File Organization
- **Current**: 40+ files in flat structure
- **After**: 60+ files in organized structure
- **Benefit**: Better discoverability, easier navigation

### Test Coverage
- **Current**: 0% (no tests)
- **Target**: 80%+ on services/hooks
- **Benefit**: Confidence in refactoring

### Performance
- **Store splitting**: ~30% reduction in unnecessary re-renders
- **Hook extraction**: Better memoization opportunities
- **Service layer**: Easier caching implementation

---

## 🎯 RECOMMENDED APPROACH

### Week 1: Foundation
- ✅ Create service layer
- ✅ Extract repositories
- ✅ Setup testing infrastructure

### Week 2: Store Refactor
- ✅ Split `use-scripts-store`
- ✅ Create specialized stores
- ✅ Migrate consumers

### Week 3: Component Cleanup
- ✅ Extract hooks
- ✅ Split large components
- ✅ Add contexts

### Week 4: Polish
- ✅ UI improvements
- ✅ Documentation
- ✅ Final testing

---

## 🚨 RISKS & MITIGATION

### Risk 1: Breaking Changes
**Mitigation**: 
- Incremental refactor
- Keep old code until migration complete
- Feature flags for gradual rollout

### Risk 2: Time Estimation
**Mitigation**:
- Start with high-value, low-risk items (services)
- Measure progress weekly
- Adjust plan based on velocity

### Risk 3: Testing Overhead
**Mitigation**:
- Focus on business logic tests (services)
- Integration tests for critical paths
- Skip UI snapshot tests initially

---

## ✅ SUCCESS CRITERIA

1. **Code Quality**
   - [ ] All stores < 200 lines
   - [ ] All components < 100 lines
   - [ ] All hooks < 50 lines
   - [ ] ESLint: 0 warnings

2. **Architecture**
   - [ ] Service layer exists
   - [ ] Repository pattern implemented
   - [ ] No direct DB access in components
   - [ ] No props drilling > 2 levels

3. **Testing**
   - [ ] 80%+ service coverage
   - [ ] 60%+ hook coverage
   - [ ] Critical paths have integration tests

4. **Performance**
   - [ ] No unnecessary re-renders (React DevTools)
   - [ ] First paint < 1s
   - [ ] Time to interactive < 2s

---

## 🔗 NEXT STEPS

1. **Get approval** for refactoring plan
2. **Create feature branch** `refactor/new-tab-architecture`
3. **Start with Phase 1** (services) - lowest risk, highest value
4. **Setup CI/CD** for automated testing
5. **Document** as we go

**Estimated Total Time**: 3-4 weeks
**Risk Level**: Medium (manageable with incremental approach)
**Value**: HIGH - Improved maintainability, testability, extensibility
