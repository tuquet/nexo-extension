# AI Studio Content Script - Development & Testing Guide

## 🐛 Bug Fix: waitForAIResponse

### Problem
`waitForAIResponse` không detect được khi AI đã hoàn thành trả lời, dẫn đến automation bị treo.

### Root Causes
1. **Selector quá cứng nhắc**: Chỉ tìm `pre code`, không match với UI thay đổi của AI Studio
2. **Logic incomplete**: Check `text.length > 500` không đủ để xác định AI đã xong
3. **Stop button unreliable**: Button có thể không tồn tại hoặc DOM thay đổi

### Solution Implemented

#### New Strategy (3-Step Detection)
```typescript
// Step 1: Detect "stop generating" button disappears
// - Button visible + enabled = still generating
// - Button gone/disabled = generation complete

// Step 2: Find response container with broader selectors
// - [data-test-id*="response"]
// - [class*="response"]
// - pre code, code, markdown containers

// Step 3: Stability check (3-second window)
// - Response text must be stable (no changes) for 3 checks
// - Ensures full content loaded before proceeding
```

#### Key Improvements
- **Broader selectors**: Match multiple UI variations
- **Stability detection**: Wait for text to stop changing (3 consecutive checks)
- **Better logging**: Detailed progress tracking with elapsed time + char count
- **Timeout handling**: Clear error messages with elapsed time

---

## 🧪 Debug Mode System

> **Note**: Debug logger hiện đã được refactor thành generic utility tái sử dụng được.
> See: [`pages/content-runtime/src/utils/CONTENT_DEBUG_LOGGER_EXAMPLES.md`](../../utils/CONTENT_DEBUG_LOGGER_EXAMPLES.md)

### Overview
Debug mode cho phép monitor real-time automation process với:
- Detailed logging (console + UI overlay)
- DOM snapshot tracking
- Log export for troubleshooting
- Visual debug panel on page
- **Reusable**: Dùng được cho ChatGPT, Claude, và các content scripts khác

### Enable Debug Mode

#### Method 1: Via Chrome DevTools Console
```javascript
// Enable debug mode
await chrome.storage.local.set({ DEBUG_MODE_AISTUDIO: true });

// Disable debug mode
await chrome.storage.local.remove('DEBUG_MODE_AISTUDIO');

// Reload page to apply
location.reload();
```

#### Method 2: Via Extension Options Page
```typescript
// Add this to options page:
const toggleDebugMode = async (enabled: boolean) => {
  await chrome.storage.local.set({ DEBUG_MODE_AISTUDIO: enabled });
  toast.success(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
};
```

### Debug Features

#### 1. Visual Debug Panel
Khi debug mode enabled, panel xuất hiện ở góc dưới phải:

```
┌──────────────────────────────────────┐
│ 🔧 AI Studio Debug    [Export Logs] │
├──────────────────────────────────────┤
│ [12:34:56] ℹ️ Starting automation   │
│ [12:34:57] 🔍 Looking for input     │
│ [12:34:58] ✅ Input found           │
│ [12:35:00] ⏳ Generating... (2s)    │
│ [12:35:15] ✅ Response ready        │
├──────────────────────────────────────┤
│ DOM Snapshot:                        │
│ Inputs: 2 | Buttons: 15 | Code: 1   │
└──────────────────────────────────────┘
```

#### 2. Enhanced Console Logging
```javascript
// Color-coded logs with emoji icons:
debugLogger.debug('Finding input element');  // 🔍 Gray
debugLogger.info('Automation started');      // ℹ️ Blue
debugLogger.warn('Slow response detected'); // ⚠️ Orange
debugLogger.error('Failed to find button'); // ❌ Red
```

#### 3. Log Export
Click "Export Logs" button để copy JSON với:
- Full log history (last 100 entries)
- DOM snapshot (inputs, buttons, code blocks)
- Timestamps, user agent, URL
- Useful cho bug reports

Example export:
```json
{
  "timestamp": "2025-11-03T10:30:45.123Z",
  "userAgent": "Mozilla/5.0...",
  "url": "https://aistudio.google.com/...",
  "logs": [
    {
      "timestamp": 1730629845123,
      "level": "info",
      "message": "Starting waitForAIResponse",
      "data": { "maxWaitTime": 120000 }
    }
  ],
  "domSnapshot": {
    "title": "Google AI Studio",
    "inputElements": ["TEXTAREA.prompt-input"],
    "buttons": ["button.send-btn [Send]"],
    "codeBlocks": 1,
    "responseContainers": ["[data-test-id=\"model-response\"] (2543 chars)"]
  }
}
```

---

## 🧪 Testing Workflow

### Local Development Testing

#### 1. Enable Debug Mode
```javascript
// In AI Studio console:
await chrome.storage.local.set({ DEBUG_MODE_AISTUDIO: true });
location.reload();
```

#### 2. Trigger Automation
```javascript
// From new-tab page, click "Tạo bằng Automate"
// Or manually via console:
chrome.tabs.sendMessage(tabId, {
  type: 'AUTOMATE_FULL_FLOW',
  payload: {
    prompt: 'Your test prompt here...',
    language: 'vi-VN',
    maxWaitTime: 60000
  }
});
```

#### 3. Monitor Debug Panel
- Watch real-time logs in bottom-right panel
- Check DOM snapshot updates every second
- Look for errors or warnings

#### 4. Export Logs if Issues
- Click "Export Logs" button
- Paste into bug report or code review

### Automated Testing (Future)

#### Test Cases to Implement
```typescript
// tests/content-runtime/aistudio.test.ts

describe('AI Studio Automation', () => {
  it('should find input element with various selectors', async () => {
    // Test findPromptInput() with different DOM structures
  });

  it('should detect stop button correctly', async () => {
    // Mock stop button presence/absence
  });

  it('should wait for response stability', async () => {
    // Simulate response text growing then stabilizing
  });

  it('should timeout after maxWaitTime', async () => {
    // Test timeout handling
  });

  it('should extract JSON from various response formats', async () => {
    // Test extractJSON() with different markups
  });
});
```

---

## 📊 Performance Monitoring

### Key Metrics to Track

```typescript
// Add to debugLogger:
interface PerformanceMetrics {
  findInputDuration: number;      // Time to find input element
  fillPromptDuration: number;     // Time to paste text
  clickSendDuration: number;      // Time to find+click send button
  waitResponseDuration: number;   // Time waiting for AI response
  extractJSONDuration: number;    // Time to extract+validate JSON
  saveToDatabaseDuration: number; // Time to save script
  totalDuration: number;          // End-to-end automation time
}
```

### Usage Example
```typescript
const startTime = performance.now();

// ... automation steps ...

const metrics: PerformanceMetrics = {
  findInputDuration: inputEndTime - startTime,
  // ... other metrics
  totalDuration: performance.now() - startTime
};

debugLogger.info('Automation complete', metrics);
```

---

## 🔧 Troubleshooting Guide

### Issue: Automation Stuck at "Waiting for AI response"

**Symptoms:**
- Debug log shows "🔍 No response detected yet..." repeatedly
- Never progresses to "✅ AI response complete"

**Diagnosis:**
1. Check debug panel → DOM Snapshot → `responseContainers: 0`
2. Export logs → Check `domSnapshot.responseContainers`
3. Look for new selector patterns in AI Studio UI

**Fix:**
```typescript
// Add new selector to responseSelectors array in waitForAIResponse()
const responseSelectors = [
  // ... existing selectors
  '[YOUR_NEW_SELECTOR]', // Add discovered selector here
];
```

### Issue: False Positive (Detects Response Too Early)

**Symptoms:**
- Response detected but JSON extraction fails
- "Invalid script JSON structure" error

**Diagnosis:**
1. Check `text.length` in debug logs
2. Verify STABLE_THRESHOLD (currently 3 checks = 3 seconds)

**Fix:**
```typescript
// Increase stability threshold if needed:
const STABLE_THRESHOLD = 5; // Wait 5 seconds instead of 3

// Or increase minimum text length:
if (text.length < 2000) { // Increase from 1000
  continue;
}
```

### Issue: Stop Button Detection Fails

**Symptoms:**
- Debug shows "⏳ Generating..." even after AI finished
- Automation never progresses

**Diagnosis:**
1. Inspect AI Studio UI for stop button element
2. Check button selectors in `stopButtonSelectors` array

**Fix:**
```typescript
// Add new stop button selectors:
const stopButtonSelectors = [
  // ... existing selectors
  'button[data-test-id*="stop"]', // New pattern
  '[aria-label*="détente" i]',    // French UI
];
```

---

## 🚀 Future Enhancements

### 1. **Mock AI Studio Page for E2E Testing**
```typescript
// tests/fixtures/mock-aistudio.html
// Create static HTML that mimics AI Studio UI
// Use in Playwright/Puppeteer tests
```

### 2. **Retry Logic with Exponential Backoff**
```typescript
const waitForAIResponseWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await waitForAIResponse();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await delay(1000 * Math.pow(2, attempt)); // 2s, 4s, 8s
    }
  }
};
```

### 3. **Visual Regression Testing**
```typescript
// Capture screenshots at each automation step
// Compare with baseline to detect UI changes
await page.screenshot({ path: 'step-1-input-found.png' });
```

### 4. **Performance Benchmarking**
```typescript
// Track metrics over time
// Alert if automation becomes slower
const BENCHMARK_THRESHOLD = {
  totalDuration: 30000, // 30 seconds max
  waitResponseDuration: 20000, // 20 seconds max for AI
};
```

---

## 📝 Development Checklist

### Before Each Release
- [ ] Test with debug mode enabled
- [ ] Verify all selectors still work
- [ ] Check console for errors
- [ ] Test timeout scenarios
- [ ] Export and review debug logs
- [ ] Disable debug mode for production build

### When AI Studio UI Changes
- [ ] Update selectors in code
- [ ] Test with real AI Studio page
- [ ] Update this documentation
- [ ] Add regression test case

---

## 🔗 Related Files

- **Main script**: `pages/content-runtime/src/matches/aistudio/index.ts`
- **Debug logger**: `pages/content-runtime/src/matches/aistudio/debug-logger.ts`
- **Background handler**: `chrome-extension/src/background/services/automation-service.ts`
- **Frontend hook**: `pages/new-tab/src/hooks/use-script-generation.ts`

---

## 📞 Support

**Enable debug mode before reporting issues:**
```javascript
await chrome.storage.local.set({ DEBUG_MODE_AISTUDIO: true });
location.reload();
```

**Include in bug reports:**
1. Exported debug logs (click "Export Logs" button)
2. Screenshots of debug panel
3. AI Studio URL and browser version
4. Expected vs actual behavior
