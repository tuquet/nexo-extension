import type { OpenExtensionPageMessage, OpenExtensionPageResponse } from './types/messages';

/**
 * Handler for opening extension pages
 */
export const handleOpenExtensionPage = async (
  message: OpenExtensionPageMessage,
): Promise<OpenExtensionPageResponse> => {
  try {
    const { page, newWindow, windowOptions } = message.payload;

    // Special handling for side panel
    if (page === 'side-panel') {
      if (chrome.sidePanel) {
        // Get the current window to open side panel
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (currentTab?.windowId) {
          await chrome.sidePanel.open({ windowId: currentTab.windowId });
        }
        return {
          success: true,
          data: { success: true },
        };
      } else {
        return {
          success: false,
          error: {
            message: 'Side panel API not available',
            code: 'SIDE_PANEL_NOT_AVAILABLE',
          },
        };
      }
    }

    // Build the URL for the extension page
    const url = chrome.runtime.getURL(`${page}/index.html`);

    if (newWindow) {
      // Open in a new window
      const window = await chrome.windows.create({
        url,
        type: windowOptions?.type || 'popup',
        width: windowOptions?.width || 800,
        height: windowOptions?.height || 600,
        left: windowOptions?.left,
        top: windowOptions?.top,
      });

      return {
        success: true,
        data: {
          success: true,
          windowId: window.id,
          tabId: window.tabs?.[0]?.id,
        },
      };
    } else {
      // Open in a new tab
      const tab = await chrome.tabs.create({ url });

      return {
        success: true,
        data: {
          success: true,
          tabId: tab.id,
        },
      };
    }
  } catch (error) {
    console.error('Failed to open extension page:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to open extension page',
        code: 'OPEN_PAGE_ERROR',
      },
    };
  }
};
