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
}
