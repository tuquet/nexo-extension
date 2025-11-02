/**
 * Utility functions to open various extension pages
 * These functions can be reused across the extension
 */

/**
 * Opens the options page in a new tab
 */
export const openOptionsPage = async (): Promise<void> => {
  try {
    const url = chrome.runtime.getURL('options/index.html');
    await chrome.tabs.create({ url });
  } catch (error) {
    console.error('Failed to open options page:', error);
  }
};

/**
 * Opens the side panel
 */
export const openSidePanel = async (): Promise<void> => {
  try {
    // Chrome 114+ supports sidePanel API
    if (chrome.sidePanel) {
      await chrome.sidePanel.open();
    } else {
      console.warn('Side panel API not available');
    }
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
};

/**
 * Opens the new tab page
 */
export const openNewTabPage = async (): Promise<void> => {
  try {
    const url = chrome.runtime.getURL('new-tab/index.html');
    await chrome.tabs.create({ url });
  } catch (error) {
    console.error('Failed to open new tab page:', error);
  }
};

/**
 * Opens the popup in a new window (useful for debugging)
 */
export const openPopupWindow = async (): Promise<void> => {
  try {
    const url = chrome.runtime.getURL('popup/index.html');
    await chrome.windows.create({
      url,
      type: 'popup',
      width: 400,
      height: 600,
    });
  } catch (error) {
    console.error('Failed to open popup window:', error);
  }
};

/**
 * Opens the devtools panel (requires devtools context)
 */
export const openDevtools = async (tabId: number): Promise<void> => {
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    // Note: Devtools can only be opened from the devtools context itself
    console.log('Debugger attached to tab', tabId);
  } catch (error) {
    console.error('Failed to open devtools:', error);
  }
};

/**
 * Generic function to open any extension page
 */
export const openExtensionPage = async (
  pagePath: 'options' | 'new-tab' | 'popup' | 'side-panel' | 'devtools' | 'devtools-panel',
  options?: {
    newTab?: boolean;
    newWindow?: boolean;
    windowOptions?: chrome.windows.CreateData;
  },
): Promise<void> => {
  try {
    // Special handling for side panel
    if (pagePath === 'side-panel') {
      await openSidePanel();
      return;
    }

    const url = chrome.runtime.getURL(`${pagePath}/index.html`);

    if (options?.newWindow) {
      await chrome.windows.create({
        url,
        type: options.windowOptions?.type || 'popup',
        width: options.windowOptions?.width || 800,
        height: options.windowOptions?.height || 600,
        ...options.windowOptions,
      });
    } else {
      await chrome.tabs.create({ url });
    }
  } catch (error) {
    console.error(`Failed to open ${pagePath} page:`, error);
  }
};
