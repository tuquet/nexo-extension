# Page Opener Utilities

This module provides utilities for opening various extension pages from anywhere in the extension.

## Architecture

### Background Service Worker
- **Location**: `chrome-extension/src/background/utils/page-opener.ts`
- **Purpose**: Direct utility functions that can be used within the background service worker
- **Handler**: `chrome-extension/src/background/page-opener-handler.ts`
- **Message Types**: Defined in `chrome-extension/src/background/types/messages.ts`

### Frontend API Wrapper
- **Location**: `pages/new-tab/src/services/background-api.ts`
- **Purpose**: Type-safe wrapper for UI pages to communicate with background service worker
- **Pattern**: Uses `chrome.runtime.sendMessage()` to proxy requests through background

## Usage

### From UI Pages (new-tab, options, popup, etc.)

```typescript
import { openOptionsPage, openSidePanel, openExtensionPage } from '@src/services/background-api';

// Open options page in new tab
await openOptionsPage();

// Open side panel
await openSidePanel();

// Open any extension page with options
await openExtensionPage('options', {
  newWindow: true,
  windowOptions: {
    type: 'popup',
    width: 800,
    height: 600,
  },
});
```

### From Background Service Worker

```typescript
import { openOptionsPage, openSidePanel, openNewTabPage, openPopupWindow, openExtensionPage } from './utils/page-opener';

// Open options page
await openOptionsPage();

// Open side panel
await openSidePanel();

// Open new tab page
await openNewTabPage();

// Open popup in a new window
await openPopupWindow();

// Generic function
await openExtensionPage('options', {
  newWindow: true,
  windowOptions: { width: 900, height: 700 },
});
```

### From Content Scripts

Content scripts cannot directly access extension pages. They must send a message to the background service worker:

```typescript
// Send message to background to open options page
const response = await chrome.runtime.sendMessage({
  type: 'OPEN_EXTENSION_PAGE',
  payload: { page: 'options' },
});

if (response.success) {
  console.log('Options page opened in tab:', response.data.tabId);
}
```

## Available Pages

- `'options'` - Extension settings page
- `'new-tab'` - Main application page (CineGenie)
- `'side-panel'` - Side panel (Chrome 114+)
- `'popup'` - Extension popup
- `'devtools'` - DevTools extension page
- `'devtools-panel'` - DevTools panel page

## Message Protocol

### Request Message

```typescript
interface OpenExtensionPageMessage {
  type: 'OPEN_EXTENSION_PAGE';
  payload: {
    page: 'options' | 'new-tab' | 'popup' | 'side-panel' | 'devtools' | 'devtools-panel';
    newWindow?: boolean;
    windowOptions?: {
      type?: 'normal' | 'popup' | 'panel';
      width?: number;
      height?: number;
      left?: number;
      top?: number;
    };
  };
}
```

### Response Message

```typescript
interface OpenExtensionPageResponse {
  success: boolean;
  data?: {
    success: boolean;
    tabId?: number;
    windowId?: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}
```

## Example: Settings Button in Header

The new-tab header demonstrates the pattern:

```tsx
import { openOptionsPage } from '@src/services/background-api';

const Header = () => {
  const handleOpenSettings = async () => {
    try {
      await openOptionsPage();
    } catch (error) {
      console.error('Failed to open options page:', error);
    }
  };

  return (
    <Button onClick={handleOpenSettings} aria-label="Settings">
      <Settings className="size-4" />
    </Button>
  );
};
```

## Error Handling

All functions follow the same error handling pattern:

```typescript
try {
  await openOptionsPage();
} catch (error) {
  // Error is automatically logged in background
  // Handle UI feedback here
  console.error('Failed to open page:', error);
}
```

## Browser Compatibility

- **Side Panel**: Requires Chrome 114+. Check availability before using:
  ```typescript
  if (chrome.sidePanel) {
    await openSidePanel();
  } else {
    // Fallback behavior
  }
  ```

## Adding New Pages

To add support for a new page:

1. Add page path to the union type in `messages.ts`:
   ```typescript
   page: 'options' | 'new-tab' | 'your-new-page';
   ```

2. Update the handler in `page-opener-handler.ts` if special handling is needed

3. Add convenience method to `background-api.ts`:
   ```typescript
   openYourNewPage: async () => {
     return await openExtensionPage('your-new-page');
   }
   ```

4. Export the method in the destructuring at the bottom of `background-api.ts`

## Testing

Test in the browser console from any extension page:

```javascript
// From new-tab page
chrome.runtime.sendMessage({
  type: 'OPEN_EXTENSION_PAGE',
  payload: { page: 'options' }
}, response => console.log(response));
```

## Best Practices

1. **Always use the wrapper functions** from `background-api.ts` in UI pages
2. **Handle errors gracefully** - show user feedback when page fails to open
3. **Check browser compatibility** before using side panel API
4. **Use semantic names** for new page types
5. **Document new pages** in this README when adding them
