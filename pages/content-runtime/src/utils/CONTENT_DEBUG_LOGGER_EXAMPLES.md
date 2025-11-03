# Content Debug Logger - Usage Examples

## Overview
Generic debug logger for any content script. Tái sử dụng được cho ChatGPT, Claude, Gemini, v.v.

---

## Basic Usage

### 1. AI Studio Content Script (Current Implementation)

```typescript
// pages/content-runtime/src/matches/aistudio/index.ts
import { createDebugLogger } from '../../utils/content-debug-logger';

const debugLogger = createDebugLogger({
  storageKey: 'DEBUG_MODE_AISTUDIO',
  context: 'AI Studio',
  themeColor: '#0f0', // Matrix green
});

// Initialize (loads from chrome.storage)
await debugLogger.init();

// Use throughout your code
debugLogger.info('Starting automation');
debugLogger.debug('Found input element', { selector: 'textarea' });
debugLogger.warn('Response taking longer than expected');
debugLogger.error('Failed to extract JSON', { error });
```

### 2. ChatGPT Content Script (Example)

```typescript
// pages/content-runtime/src/matches/chatgpt/index.ts
import { createDebugLogger } from '../../utils/content-debug-logger';

const debugLogger = createDebugLogger({
  storageKey: 'DEBUG_MODE_CHATGPT',
  context: 'ChatGPT',
  themeColor: '#10a37f', // ChatGPT brand green
});

await debugLogger.init();

debugLogger.info('ChatGPT automation started');
```

### 3. Claude Content Script (Example)

```typescript
// pages/content-runtime/src/matches/claude/index.ts
import { createDebugLogger } from '../../utils/content-debug-logger';

const debugLogger = createDebugLogger({
  storageKey: 'DEBUG_MODE_CLAUDE',
  context: 'Claude',
  themeColor: '#d97706', // Claude orange
});

await debugLogger.init();
```

---

## Custom DOM Snapshot

Mỗi platform có DOM structure khác nhau. Bạn có thể customize snapshot:

### Example: ChatGPT Custom Snapshot

```typescript
const debugLogger = createDebugLogger({
  storageKey: 'DEBUG_MODE_CHATGPT',
  context: 'ChatGPT',
  themeColor: '#10a37f',
  getDOMSnapshot: () => {
    // ChatGPT-specific selectors
    const messages = document.querySelectorAll('[data-message-id]').length;
    const inputPrompt = document.querySelector('textarea[data-id]');
    const sendButton = document.querySelector('button[data-testid="send-button"]');
    const regenerateButton = document.querySelector('button[data-testid="regenerate-button"]');

    return {
      title: document.title,
      url: window.location.href,
      messages: messages,
      inputFound: !!inputPrompt,
      sendButtonEnabled: sendButton && !sendButton.disabled,
      regenerateVisible: !!regenerateButton,
      conversationId: new URLSearchParams(window.location.search).get('id'),
    };
  },
});
```

### Example: Claude Custom Snapshot

```typescript
const debugLogger = createDebugLogger({
  storageKey: 'DEBUG_MODE_CLAUDE',
  context: 'Claude',
  themeColor: '#d97706',
  getDOMSnapshot: () => {
    const chatMessages = document.querySelectorAll('[data-testid="chat-message"]').length;
    const inputField = document.querySelector('[contenteditable="true"]');
    const thinkingIndicator = document.querySelector('[data-testid="thinking-indicator"]');

    return {
      title: document.title,
      url: window.location.href,
      messageCount: chatMessages,
      inputAvailable: !!inputField,
      isThinking: !!thinkingIndicator,
      projectId: window.location.pathname.split('/')[2],
    };
  },
});
```

---

## Enabling Debug Mode

### Option 1: Chrome DevTools Console

```javascript
// Enable AI Studio debug
await chrome.storage.local.set({ DEBUG_MODE_AISTUDIO: true });

// Enable ChatGPT debug
await chrome.storage.local.set({ DEBUG_MODE_CHATGPT: true });

// Enable Claude debug
await chrome.storage.local.set({ DEBUG_MODE_CLAUDE: true });

// Reload page
location.reload();
```

### Option 2: Extension Options Page

Add toggle switches in options page:

```tsx
// pages/options/src/components/tabs/AdvancedTab.tsx
import { Switch } from '@extension/ui';

const AdvancedTab = () => {
  const [debugModes, setDebugModes] = useState({
    aiStudio: false,
    chatGpt: false,
    claude: false,
  });

  useEffect(() => {
    // Load from storage
    chrome.storage.local.get(
      ['DEBUG_MODE_AISTUDIO', 'DEBUG_MODE_CHATGPT', 'DEBUG_MODE_CLAUDE'],
      result => {
        setDebugModes({
          aiStudio: result.DEBUG_MODE_AISTUDIO || false,
          chatGpt: result.DEBUG_MODE_CHATGPT || false,
          claude: result.DEBUG_MODE_CLAUDE || false,
        });
      },
    );
  }, []);

  const toggleDebugMode = async (platform: string, enabled: boolean) => {
    const key = `DEBUG_MODE_${platform.toUpperCase()}`;
    await chrome.storage.local.set({ [key]: enabled });
    toast.success(`${platform} debug mode ${enabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Mode (Developer)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>AI Studio Debug</Label>
          <Switch
            checked={debugModes.aiStudio}
            onCheckedChange={val => toggleDebugMode('aistudio', val)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>ChatGPT Debug</Label>
          <Switch
            checked={debugModes.chatGpt}
            onCheckedChange={val => toggleDebugMode('chatgpt', val)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Claude Debug</Label>
          <Switch
            checked={debugModes.claude}
            onCheckedChange={val => toggleDebugMode('claude', val)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
```

### Option 3: Programmatic Control

```typescript
// Enable temporarily for testing
await debugLogger.enable();

// Run some automation
await runAutomation();

// Disable after testing
await debugLogger.disable();
```

---

## Advanced Features

### 1. Performance Timing

```typescript
const startTime = performance.now();

debugLogger.info('Starting task');

// ... do work ...

const duration = performance.now() - startTime;
debugLogger.info('Task completed', { duration: `${duration.toFixed(2)}ms` });
```

### 2. Conditional Logging

```typescript
// Only log if debug enabled (no console spam in production)
if (debugLogger.isEnabled()) {
  const heavyData = computeExpensiveDebugInfo();
  debugLogger.debug('Heavy debug data', heavyData);
}
```

### 3. Error Tracking

```typescript
try {
  await riskyOperation();
} catch (error) {
  debugLogger.error('Operation failed', {
    message: error.message,
    stack: error.stack,
    context: getCurrentContext(),
  });
  throw error;
}
```

### 4. Export Logs for Bug Reports

User can click "Export Logs" button in debug panel, hoặc programmatically:

```typescript
// After error occurs
const logs = debugLogger.exportLogs();
await saveToFile(logs, 'debug-session.json');

// Or send to backend
await fetch('/api/debug-reports', {
  method: 'POST',
  body: logs,
});
```

---

## Best Practices

### 1. Log Levels Usage

- **debug**: Detailed state info, frequent updates
  ```typescript
  debugLogger.debug('Polling for response', { attempt: 3, elapsed: '5.2s' });
  ```

- **info**: Key milestones in flow
  ```typescript
  debugLogger.info('Automation started');
  debugLogger.info('Response received', { length: 2543 });
  debugLogger.info('Script saved successfully');
  ```

- **warn**: Potential issues, slowness
  ```typescript
  debugLogger.warn('Response taking longer than expected', { elapsed: '30s' });
  debugLogger.warn('Selector not found, trying fallback', { selector });
  ```

- **error**: Failures requiring attention
  ```typescript
  debugLogger.error('Failed to extract JSON', { error: e.message });
  debugLogger.error('Timeout waiting for response', { maxWait: 60000 });
  ```

### 2. Meaningful Context

Always include useful data:

```typescript
// ❌ Bad: No context
debugLogger.debug('Found element');

// ✅ Good: Rich context
debugLogger.debug('Found element', {
  selector: 'textarea.prompt-input',
  tagName: element.tagName,
  visible: element.offsetParent !== null,
});
```

### 3. Performance Considerations

```typescript
// ❌ Bad: Computing expensive data even when debug disabled
debugLogger.debug('Full DOM', { dom: document.body.innerHTML });

// ✅ Good: Lazy evaluation
if (debugLogger.isEnabled()) {
  debugLogger.debug('Full DOM', { dom: document.body.innerHTML });
}
```

---

## Testing Debug Logger

```typescript
// tests/content-runtime/debug-logger.test.ts
import { createDebugLogger } from '../src/utils/content-debug-logger';

describe('ContentDebugLogger', () => {
  it('should create logger with custom config', () => {
    const logger = createDebugLogger({
      storageKey: 'DEBUG_MODE_TEST',
      context: 'Test',
      themeColor: '#ff0000',
    });

    expect(logger).toBeDefined();
  });

  it('should log messages when enabled', async () => {
    const logger = createDebugLogger({
      storageKey: 'DEBUG_MODE_TEST',
      context: 'Test',
    });

    await logger.enable();

    const spy = jest.spyOn(console, 'log');
    logger.info('Test message');

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Test'),
      expect.stringContaining('Test message'),
      '',
    );
  });

  it('should export logs correctly', async () => {
    const logger = createDebugLogger({
      storageKey: 'DEBUG_MODE_TEST',
      context: 'Test',
    });

    await logger.enable();
    logger.info('Message 1');
    logger.error('Message 2');

    const exported = logger.exportLogs();
    const parsed = JSON.parse(exported);

    expect(parsed.logs).toHaveLength(3); // enable + 2 messages
    expect(parsed.context).toBe('Test');
  });
});
```

---

## Migration Guide

### Migrating Existing Debug Code

**Before (hardcoded):**
```typescript
const DEBUG = true;

if (DEBUG) {
  console.log('[AI Studio] Starting...');
}
```

**After (using content-debug-logger):**
```typescript
import { createDebugLogger } from '../../utils/content-debug-logger';

const debugLogger = createDebugLogger({
  storageKey: 'DEBUG_MODE_AISTUDIO',
  context: 'AI Studio',
  themeColor: '#0f0',
});

await debugLogger.init();

debugLogger.info('Starting...');
```

---

## FAQ

**Q: Có thể dùng nhiều logger trong cùng 1 page không?**
A: Có, mỗi logger có panelId riêng. Ví dụ: AI Studio + ChatGPT debug panels cùng lúc.

**Q: Logger có ảnh hưởng performance khi disabled không?**
A: Không. Khi disabled, chỉ có check `if (enabled)` trước khi log.

**Q: Có thể customize UI panel không?**
A: Hiện tại chưa. Nhưng có thể fork `content-debug-logger.ts` và customize `addDebugUI()`.

**Q: Logs có bị mất khi reload page không?**
A: Có. Logs chỉ lưu trong memory. Export trước khi reload nếu cần.

**Q: Có thể log vào file không?**
A: Không trực tiếp. Nhưng có thể `exportLogs()` và download qua background script.

---

## Roadmap

- [ ] Persistent logs (IndexedDB)
- [ ] Log filtering by level
- [ ] Collapsible log entries
- [ ] Screenshot capture on error
- [ ] Network request logging
- [ ] Performance metrics tracking
