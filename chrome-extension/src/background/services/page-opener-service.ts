import type { IPageOpenerService } from '../core/interfaces';

/**
 * PageOpenerService - Encapsulates Chrome extension navigation
 *
 * Implements IPageOpenerService interface for dependency injection.
 * Provides clean abstraction over chrome.tabs, chrome.sidePanel, etc.
 *
 * @example
 * ```typescript
 * const service = new PageOpenerService();
 * await service.openOptionsPage();
 * await service.openNewTab('https://example.com');
 * ```
 */
export class PageOpenerService implements IPageOpenerService {
  /**
   * Open extension options page
   *
   * Uses chrome.runtime.openOptionsPage() to open settings.
   */
  async openOptionsPage(): Promise<void> {
    await chrome.runtime.openOptionsPage();
  }

  /**
   * Open side panel
   *
   * Uses chrome.sidePanel.open() if available (Chrome 114+).
   * Falls back gracefully if API not available.
   */
  async openSidePanel(): Promise<void> {
    if (chrome.sidePanel?.open) {
      await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    } else {
      console.warn('Side panel API not available in this Chrome version');
    }
  }

  /**
   * Open new tab with specified URL
   *
   * @param url URL to open (defaults to chrome://newtab/)
   */
  async openNewTab(url?: string): Promise<void> {
    await chrome.tabs.create({
      url: url || 'chrome://newtab/',
      active: true,
    });
  }

  /**
   * Open extension popup
   *
   * Uses chrome.action.openPopup() if available.
   * Note: This only works when called in response to user action.
   */
  async openPopup(): Promise<void> {
    if (chrome.action?.openPopup) {
      await chrome.action.openPopup();
    } else {
      console.warn('Action API openPopup not available');
    }
  }

  /**
   * Open extension page (new-tab, options, popup, side-panel, etc.)
   *
   * @param params Page name, window options
   * @returns Tab ID and window ID if opened
   */
  async openExtensionPage(params: {
    page: string;
    newWindow?: boolean;
    windowOptions?: {
      type?: 'normal' | 'popup';
      width?: number;
      height?: number;
      left?: number;
      top?: number;
    };
  }): Promise<{ tabId?: number; windowId?: number }> {
    const { page, newWindow, windowOptions } = params;

    // Special handling for side panel
    if (page === 'side-panel') {
      await this.openSidePanel();
      return {};
    }

    // Build URL for extension page
    const url = chrome.runtime.getURL(`${page}/index.html`);

    if (newWindow) {
      // Open in new window
      const window = await chrome.windows.create({
        url,
        type: windowOptions?.type || 'popup',
        width: windowOptions?.width || 800,
        height: windowOptions?.height || 600,
        left: windowOptions?.left,
        top: windowOptions?.top,
      });

      return {
        tabId: window.tabs?.[0]?.id,
        windowId: window.id,
      };
    } else {
      // Open in new tab
      const tab = await chrome.tabs.create({ url, active: true });
      return {
        tabId: tab.id,
        windowId: tab.windowId,
      };
    }
  }

  /**
   * Close current tab
   *
   * Gets current tab and closes it.
   * Useful for closing automation tabs after completion.
   */
  async closeCurrentTab(): Promise<void> {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (currentTab?.id) {
      await chrome.tabs.remove(currentTab.id);
    }
  }
}
