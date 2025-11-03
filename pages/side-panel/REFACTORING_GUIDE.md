# Side Panel Refactoring Guide

## 🎯 Mục tiêu

Cải thiện kiến trúc side-panel để:
- ✅ Tách biệt UI, business logic, và data fetching
- ✅ Reusable hooks và services
- ✅ Better state management
- ✅ Easier to test và maintain

## 📊 Phân tích hiện tại

### ❌ Vấn đề

#### 1. **Mixed Concerns trong Components**
```tsx
// ❌ BAD: Component làm quá nhiều việc
export const PromptLibrary: React.FC = () => {
  // 1. Data fetching logic
  const loadPrompts = async () => {
    const dbPrompts = await db.prompts.toArray();
    // ...
  };
  
  // 2. Business logic
  const handleUsePrompt = async (prompt) => {
    setIsProcessing(true);
    const response = await chrome.runtime.sendMessage({ ... });
    // ...
  };
  
  // 3. UI state management
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // 4. Filtering logic
  const filteredPrompts = prompts.filter(p => { ... });
  
  // 5. UI rendering
  return <div>...</div>;
};
```

#### 2. **Direct Database Access trong Components**
```tsx
// ❌ BAD: Component trực tiếp gọi database
const loadPrompts = async () => {
  const dbPrompts = await db.prompts.toArray();
  setPrompts(dbPrompts);
};
```

#### 3. **Duplicate Logic**
```tsx
// ❌ BAD: Logic lặp lại ở nhiều nơi
// HomePage.tsx
const result = await chrome.storage.local.get('automatePromptData');

// PromptLibrary.tsx  
const result = await chrome.storage.local.get('automatePromptData');
```

#### 4. **No Proper Error Handling**
```tsx
// ❌ BAD: Silent failures
try {
  const result = await chrome.storage.local.get('automatePromptData');
} catch (error) {
  console.error('Failed:', error); // Just log, no user feedback
}
```

## ✅ Giải pháp - Kiến trúc mới

### 1. **Custom Hooks (Separation of Concerns)**

```typescript
// hooks/use-prompts.ts
export const usePrompts = () => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const loadPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await promptService.getAll();
      setPrompts(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    void loadPrompts();
  }, [loadPrompts]);
  
  return { prompts, loading, error, reload: loadPrompts };
};
```

**Benefits:**
- ✅ Reusable across components
- ✅ Centralized data fetching logic
- ✅ Proper error handling
- ✅ Easy to test

### 2. **Service Layer (Business Logic)**

```typescript
// services/prompt-service.ts
export class PromptService {
  constructor(private db: IDatabase) {}
  
  async getAll(): Promise<PromptTemplate[]> {
    const dbPrompts = await this.db.prompts.toArray();
    
    if (dbPrompts.length === 0) {
      return GEMINI_PROMPTS; // Fallback to defaults
    }
    
    return dbPrompts.map(this.mapToTemplate);
  }
  
  async getById(id: string): Promise<PromptTemplate | null> {
    const prompt = await this.db.prompts.get(parseInt(id));
    return prompt ? this.mapToTemplate(prompt) : null;
  }
  
  async create(data: PromptFormData): Promise<PromptTemplate> {
    const id = await this.db.prompts.add({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.getById(String(id));
  }
  
  async update(id: string, data: Partial<PromptFormData>): Promise<void> {
    await this.db.prompts.update(parseInt(id), {
      ...data,
      updatedAt: new Date(),
    });
  }
  
  async delete(id: string): Promise<void> {
    await this.db.prompts.delete(parseInt(id));
  }
  
  private mapToTemplate(p: PromptRecord): PromptTemplate {
    return {
      id: String(p.id),
      title: p.title,
      category: p.category,
      prompt: p.prompt,
      description: p.description,
      tags: p.tags,
      icon: p.icon,
    };
  }
}

// Export singleton instance
export const promptService = new PromptService(db);
```

**Benefits:**
- ✅ Single Responsibility: Only handles prompt data operations
- ✅ Abstraction: Components don't know about database details
- ✅ Testable: Easy to mock IDatabase
- ✅ Reusable: Can be used from any component

### 3. **Automation Service**

```typescript
// services/automation-service.ts
export class AutomationService {
  constructor(private storage: IStorageService) {}
  
  async getAutomationData(): Promise<AutomatePromptData | null> {
    try {
      const data = await this.storage.get<AutomatePromptData>('automatePromptData');
      
      if (!data) return null;
      
      // Check if data is recent (within 10 seconds)
      if (Date.now() - data.timestamp > 10000) {
        await this.clearAutomationData();
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load automation data:', error);
      return null;
    }
  }
  
  async setAutomationData(data: Omit<AutomatePromptData, 'timestamp'>): Promise<void> {
    await this.storage.set('automatePromptData', {
      ...data,
      timestamp: Date.now(),
    });
  }
  
  async clearAutomationData(): Promise<void> {
    await this.storage.remove('automatePromptData');
  }
  
  async sendToBackground(prompt: string, title: string): Promise<void> {
    const response = await chrome.runtime.sendMessage({
      type: 'AUTO_FILL_GEMINI_PROMPT',
      payload: { prompt, title },
    });
    
    if (!response.success) {
      throw new Error(response.error?.message || 'Automation failed');
    }
  }
}

// Export singleton
export const automationService = new AutomationService(chromeStorageService);
```

### 4. **Custom Hook for Automation**

```typescript
// hooks/use-automation.ts
export const useAutomation = () => {
  const [automationData, setAutomationData] = useState<AutomatePromptData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    void automationService.getAutomationData().then(setAutomationData);
  }, []);
  
  const execute = useCallback(async (prompt: string, title: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      await automationService.sendToBackground(prompt, title);
      toast.success(`Đã điền prompt "${title}" vào Google AI Studio`);
    } catch (err) {
      setError(err as Error);
      toast.error(`Lỗi: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  return {
    automationData,
    isProcessing,
    error,
    execute,
  };
};
```

### 5. **Refactored Component (Presentation Only)**

```tsx
// components/PromptLibrary.tsx
export const PromptLibrary: React.FC = () => {
  // Custom hooks handle all logic
  const { prompts, loading, error: promptsError } = usePrompts();
  const { execute, isProcessing, error: automationError } = useAutomation();
  const { search, setSearch, selectedCategory, setSelectedCategory } = useFilters();
  
  // Pure filtering logic (could be moved to hook if complex)
  const filteredPrompts = useMemo(
    () => prompts.filter(p => matchesFilters(p, search, selectedCategory)),
    [prompts, search, selectedCategory]
  );
  
  // UI only
  return (
    <div>
      {/* Search */}
      <Input value={search} onChange={e => setSearch(e.target.value)} />
      
      {/* Category filter */}
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        {/* ... */}
      </Select>
      
      {/* Loading/Error states */}
      {loading && <LoadingSpinner />}
      {promptsError && <ErrorDisplay error={promptsError} />}
      
      {/* Prompt list */}
      {filteredPrompts.map(prompt => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onUse={() => execute(prompt.prompt, prompt.title)}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
};
```

**Benefits:**
- ✅ Component chỉ lo UI rendering
- ✅ Logic tách ra hooks và services
- ✅ Easy to test (test hooks separately)
- ✅ Reusable hooks

### 6. **Utility Hook for Filters**

```typescript
// hooks/use-filters.ts
export const useFilters = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const reset = useCallback(() => {
    setSearch('');
    setSelectedCategory('all');
  }, []);
  
  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    reset,
  };
};
```

## 🏗️ Folder Structure

```
pages/side-panel/src/
├── components/
│   ├── PromptLibrary.tsx         # Presentation component
│   ├── PromptCard.tsx            # Prompt item component
│   └── AutomationBanner.tsx      # Automation context display
│
├── hooks/
│   ├── use-prompts.ts            # Prompt data management
│   ├── use-automation.ts         # Automation logic
│   ├── use-filters.ts            # Filter state management
│   └── use-chrome-storage.ts    # Chrome storage abstraction
│
├── services/
│   ├── prompt-service.ts         # Prompt CRUD operations
│   ├── automation-service.ts    # Automation logic
│   ├── chrome-storage-service.ts # Chrome storage wrapper
│   └── interfaces.ts             # Service interfaces
│
├── pages/
│   └── HomePage.tsx              # Page composition
│
├── types/
│   └── index.ts                  # Type definitions
│
└── utils/
    ├── filters.ts                # Filter logic
    └── validators.ts             # Validation functions
```

## 🔄 Migration Plan

### Phase 1: Services
- [ ] Create `services/interfaces.ts`
- [ ] Create `services/chrome-storage-service.ts`
- [ ] Create `services/prompt-service.ts`
- [ ] Create `services/automation-service.ts`

### Phase 2: Hooks
- [ ] Create `hooks/use-prompts.ts`
- [ ] Create `hooks/use-automation.ts`
- [ ] Create `hooks/use-filters.ts`

### Phase 3: Components
- [ ] Refactor `PromptLibrary.tsx` to use hooks
- [ ] Extract `PromptCard.tsx` component
- [ ] Create `AutomationBanner.tsx`
- [ ] Refactor `HomePage.tsx`

### Phase 4: Testing
- [ ] Unit tests for services
- [ ] Unit tests for hooks
- [ ] Component tests
- [ ] Integration tests

## 📝 Example: Before vs After

### Before
```tsx
// ❌ 273 lines of mixed concerns
export const PromptLibrary: React.FC = () => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const loadPrompts = async () => {
    const dbPrompts = await db.prompts.toArray();
    if (dbPrompts.length === 0) {
      setPrompts(GEMINI_PROMPTS);
    } else {
      setPrompts(dbPrompts.map(p => ({ ... })));
    }
  };
  
  const handleUsePrompt = async (prompt) => {
    setIsProcessing(true);
    try {
      const response = await chrome.runtime.sendMessage({ ... });
      toast.success('Success');
    } catch (error) {
      toast.error('Error');
    }
    setIsProcessing(false);
  };
  
  return <div>...273 lines...</div>;
};
```

### After
```tsx
// ✅ ~50 lines, focused on UI
export const PromptLibrary: React.FC = () => {
  const { prompts, loading, error } = usePrompts();
  const { execute, isProcessing } = useAutomation();
  const { search, setSearch, selectedCategory, setSelectedCategory } = useFilters();
  
  const filteredPrompts = useFilteredPrompts(prompts, { search, category: selectedCategory });
  
  return (
    <div>
      <SearchBar value={search} onChange={setSearch} />
      <CategoryFilter value={selectedCategory} onChange={setSelectedCategory} />
      
      {loading && <LoadingSpinner />}
      {error && <ErrorDisplay error={error} />}
      
      <PromptList
        prompts={filteredPrompts}
        onUse={execute}
        isProcessing={isProcessing}
      />
    </div>
  );
};
```

## 🧪 Testing Strategy

### Service Tests
```typescript
describe('PromptService', () => {
  it('should load prompts from database', async () => {
    const mockDB = { prompts: { toArray: jest.fn() } };
    const service = new PromptService(mockDB);
    
    await service.getAll();
    
    expect(mockDB.prompts.toArray).toHaveBeenCalled();
  });
});
```

### Hook Tests
```typescript
import { renderHook, waitFor } from '@testing-library/react';

describe('usePrompts', () => {
  it('should load prompts on mount', async () => {
    const { result } = renderHook(() => usePrompts());
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.prompts.length).toBeGreaterThan(0);
    });
  });
});
```

### Component Tests
```typescript
describe('PromptLibrary', () => {
  it('should render prompts', () => {
    render(<PromptLibrary />);
    
    expect(screen.getByText('Search')).toBeInTheDocument();
  });
});
```

## 📊 Benefits

### Code Organization
- ✅ 273 lines → ~50 lines per component
- ✅ Logic tách riêng, dễ tìm
- ✅ Consistent structure

### Reusability
- ✅ Hooks có thể dùng ở nhiều components
- ✅ Services có thể dùng ở nhiều hooks
- ✅ Không duplicate code

### Testability
- ✅ Test services độc lập
- ✅ Test hooks với renderHook
- ✅ Test components với mocked hooks

### Maintainability
- ✅ Thay đổi business logic không ảnh hưởng UI
- ✅ Thay đổi UI không ảnh hưởng business logic
- ✅ Easy to debug

## 🚀 Next Steps

1. Review và approve refactoring plan
2. Implement Phase 1 (Services)
3. Implement Phase 2 (Hooks)
4. Refactor components
5. Add tests
6. Update documentation
