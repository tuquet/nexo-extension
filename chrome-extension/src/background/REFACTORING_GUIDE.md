# Background Service Worker Refactoring Guide

## 🎯 Mục tiêu

Cải thiện kiến trúc background service worker để:
- ✅ Tuân thủ SOLID principles
- ✅ Tăng khả năng bảo trì và mở rộng
- ✅ Type-safe hơn, ít type casting
- ✅ Dễ dàng test và mock
- ✅ Tách biệt concerns rõ ràng

## 📊 Phân tích hiện tại

### ❌ Vấn đề

#### 1. **Single Responsibility Violation**
```typescript
// ❌ BAD: Handler làm quá nhiều việc
export const handleGenerateScript = async (message) => {
  // 1. Validation
  if (!apiKey) throw new Error('...');
  
  // 2. Initialize client
  const client = new GoogleGenAI({ apiKey });
  
  // 3. Business logic
  const model = client.getGenerativeModel({ ... });
  
  // 4. Error handling
  try { ... } catch { ... }
  
  // 5. Response formatting
  return { success: true, data: ... };
};
```

#### 2. **Open/Closed Violation**
```typescript
// ❌ BAD: Type casting breaks type safety
const messageRoutes: { [key: string]: MessageHandler } = {
  GENERATE_SCRIPT: handleGenerateScript as unknown as MessageHandler,
  // Must modify router to add new handlers
};
```

#### 3. **Dependency Inversion Violation**
```typescript
// ❌ BAD: Direct dependency on concrete implementation
const client = new GoogleGenAI({ apiKey }); // Tightly coupled to Gemini
const response = await fetch(url, { ... }); // Tightly coupled to fetch
```

#### 4. **Interface Segregation Violation**
```typescript
// ❌ BAD: Fat interface with many optional fields
interface GeminiGenerateScriptMessage {
  type: 'GENERATE_SCRIPT';
  payload: {
    prompt: string;
    language?: string;
    apiKey?: string;
    modelName?: string;
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    systemInstruction?: string;
    // ... 10+ more fields
  };
}
```

## ✅ Giải pháp - Kiến trúc mới

### 1. **Base Handler (Template Method Pattern)**

```typescript
// core/base-handler.ts
export abstract class BaseHandler<TRequest, TResponse> {
  protected abstract execute(request: TRequest): Promise<TResponse>;
  
  async handle(request: TRequest): Promise<BaseResponse<TResponse>> {
    try {
      const data = await this.execute(request);
      return { success: true, data };
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  protected handleError(error: unknown): BaseResponse<TResponse> {
    // Centralized error handling
  }
}
```

**Benefits:**
- ✅ Single Responsibility: Tách error handling ra khỏi business logic
- ✅ Open/Closed: Extend via inheritance, không modify base class
- ✅ DRY: Không duplicate error handling code

### 2. **Service Interfaces (Dependency Inversion)**

```typescript
// core/interfaces.ts
export interface IAIService {
  generateScript(params: ScriptGenParams): Promise<ScriptStory>;
  generateImage(params: ImageGenParams): Promise<ImageResult>;
  // ... other methods
}

export interface ISettingsService {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export interface ITTSService {
  createProject(params: TTSParams): Promise<{ projectId: string }>;
}
```

**Benefits:**
- ✅ Dependency Inversion: Depend on abstractions
- ✅ Easy to mock for testing
- ✅ Easy to swap implementations (Gemini → OpenAI, Chrome Storage → IndexedDB)

### 3. **Concrete Implementations**

```typescript
// services/gemini-ai-service.ts
export class GeminiAIService implements IAIService {
  constructor(private apiKey: string) {}
  
  async generateScript(params: ScriptGenParams): Promise<ScriptStory> {
    const client = new GoogleGenAI({ apiKey: this.apiKey });
    // Implementation
  }
}

// services/chrome-settings-service.ts
export class ChromeSettingsService implements ISettingsService {
  async get<T>(key: string): Promise<T | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }
}
```

### 4. **Handler Implementations**

```typescript
// handlers/generate-script-handler.ts
export class GenerateScriptHandler extends BaseHandler<
  GeminiGenerateScriptMessage,
  ScriptStory
> {
  constructor(
    private aiService: IAIService,
    private settingsService: ISettingsService
  ) {
    super();
  }
  
  protected async execute(request: GeminiGenerateScriptMessage): Promise<ScriptStory> {
    const { payload } = request;
    
    // Validation
    if (!payload.apiKey) {
      const settings = await this.settingsService.get('apiKeys');
      if (!settings?.gemini) {
        throw new Error('API key required');
      }
    }
    
    // Business logic only
    return this.aiService.generateScript({
      prompt: payload.prompt,
      language: payload.language,
      // ... map params
    });
  }
}
```

**Benefits:**
- ✅ Single Responsibility: Handler chỉ orchestrate services
- ✅ Dependency Injection: Services passed via constructor
- ✅ Easy to test: Mock IAIService và ISettingsService

### 5. **Type-Safe Router**

```typescript
// core/router.ts
export class MessageRouter {
  private handlers = new Map<string, BaseHandler<any, any>>();
  
  register<TReq, TRes>(
    type: string,
    handler: BaseHandler<TReq, TRes>
  ): void {
    this.handlers.set(type, handler);
  }
  
  async route(message: BackgroundMessage): Promise<BackgroundResponse> {
    const handler = this.handlers.get(message.type);
    if (!handler) {
      return { success: false, error: { message: 'Unknown message type' } };
    }
    return handler.handle(message);
  }
}
```

**Benefits:**
- ✅ Open/Closed: Add handlers without modifying router
- ✅ Type-safe: No more `as unknown as MessageHandler`
- ✅ Centralized registration

### 6. **Dependency Injection Container**

```typescript
// core/di-container.ts
export class DIContainer {
  private services = new Map<string, any>();
  
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
  }
  
  resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) throw new Error(`Service ${key} not found`);
    return service;
  }
}

// Setup
const container = new DIContainer();
container.register('aiService', new GeminiAIService(apiKey));
container.register('settingsService', new ChromeSettingsService());
container.register('ttsService', new VbeeTTSService());

// Use
const generateScriptHandler = new GenerateScriptHandler(
  container.resolve('aiService'),
  container.resolve('settingsService')
);
```

## 🔄 Migration Plan

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create `core/base-handler.ts`
- [ ] Create `core/interfaces.ts`
- [ ] Create `core/router.ts`
- [ ] Create `core/di-container.ts`

### Phase 2: Services (Week 2)
- [ ] `services/gemini-ai-service.ts` implementing `IAIService`
- [ ] `services/chrome-settings-service.ts` implementing `ISettingsService`
- [ ] `services/vbee-tts-service.ts` implementing `ITTSService`
- [ ] `services/page-opener-service.ts` implementing `IPageOpenerService`

### Phase 3: Handlers (Week 3)
- [ ] `handlers/generate-script-handler.ts`
- [ ] `handlers/generate-image-handler.ts`
- [ ] `handlers/generate-video-handler.ts`
- [ ] `handlers/create-vbee-project-handler.ts`
- [ ] `handlers/settings-handler.ts`

### Phase 4: Integration (Week 4)
- [ ] Update `index.ts` with DI container setup
- [ ] Update `router.ts` to use new handler registration
- [ ] Migrate all handlers to new architecture
- [ ] Update tests

### Phase 5: Cleanup
- [ ] Remove old handler files
- [ ] Update documentation
- [ ] Remove type casting workarounds

## 📝 Example: Before vs After

### Before (Current)
```typescript
// ❌ Tightly coupled, hard to test, violates SRP
export const handleGenerateScript = async (
  message: GeminiGenerateScriptMessage
): Promise<BaseResponse<ScriptStory>> => {
  try {
    const apiKey = message.payload.apiKey || (await getSettings()).apiKeys?.gemini;
    if (!apiKey) throw new ApiAuthError('API key missing');
    
    const client = new GoogleGenAI({ apiKey });
    const model = client.getGenerativeModel({
      model: message.payload.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: SCRIPT_GENERATION_SCHEMA,
      },
    });
    
    const result = await model.generateContent(message.payload.prompt);
    const script = JSON.parse(result.response.text());
    
    return { success: true, data: script };
  } catch (error) {
    return {
      success: false,
      error: { message: error.message, code: 'API_ERROR' },
    };
  }
};
```

### After (Refactored)
```typescript
// ✅ Loose coupling, testable, follows SOLID
export class GenerateScriptHandler extends BaseHandler<
  GeminiGenerateScriptMessage,
  ScriptStory
> {
  constructor(
    private aiService: IAIService,
    private settingsService: ISettingsService
  ) {
    super();
  }
  
  protected async execute(request: GeminiGenerateScriptMessage): Promise<ScriptStory> {
    const apiKey = request.payload.apiKey || 
      (await this.settingsService.get('apiKeys'))?.gemini;
      
    if (!apiKey) {
      throw new ApiAuthError('API key missing');
    }
    
    return this.aiService.generateScript({
      prompt: request.payload.prompt,
      modelName: request.payload.modelName,
      language: request.payload.language,
    });
  }
}

// Testing is easy
const mockAIService = {
  generateScript: jest.fn().mockResolvedValue(mockScript),
};
const handler = new GenerateScriptHandler(mockAIService, mockSettingsService);
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('GenerateScriptHandler', () => {
  it('should generate script successfully', async () => {
    // Mock services
    const mockAIService = { generateScript: jest.fn() };
    const mockSettings = { get: jest.fn() };
    
    // Create handler with mocks
    const handler = new GenerateScriptHandler(mockAIService, mockSettings);
    
    // Test
    const result = await handler.handle(mockMessage);
    
    expect(result.success).toBe(true);
    expect(mockAIService.generateScript).toHaveBeenCalled();
  });
});
```

### Integration Tests
```typescript
describe('MessageRouter Integration', () => {
  it('should route messages to correct handlers', async () => {
    const router = new MessageRouter();
    const handler = new GenerateScriptHandler(realAIService, realSettings);
    
    router.register('GENERATE_SCRIPT', handler);
    
    const result = await router.route({
      type: 'GENERATE_SCRIPT',
      payload: { ... }
    });
    
    expect(result.success).toBe(true);
  });
});
```

## 📊 Benefits Summary

### Maintainability
- ✅ Tách biệt concerns rõ ràng
- ✅ Mỗi class có 1 trách nhiệm duy nhất
- ✅ Dễ tìm và sửa lỗi

### Extensibility
- ✅ Thêm handler mới không cần sửa code cũ
- ✅ Swap implementations dễ dàng (Gemini → OpenAI)
- ✅ Plugin architecture

### Testability
- ✅ Mock services dễ dàng
- ✅ Unit test từng handler độc lập
- ✅ Integration test với real services

### Type Safety
- ✅ Không còn type casting `as unknown as`
- ✅ Compile-time type checking
- ✅ IntelliSense support tốt hơn

## 🚀 Next Steps

1. Review và approve refactoring plan
2. Create branch `refactor/background-solid`
3. Implement Phase 1 (Core Infrastructure)
4. Write tests cho core infrastructure
5. Implement Phase 2 (Services) with tests
6. Continue with remaining phases
7. Merge to main when complete

## 📚 References

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
- [Template Method Pattern](https://refactoring.guru/design-patterns/template-method)
- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
