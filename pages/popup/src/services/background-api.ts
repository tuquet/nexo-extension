/**
 * Background API Wrapper for Popup
 * Provides type-safe methods to communicate with background service worker
 */

/**
 * Send a message to the background service worker and wait for response
 */
const sendMessage = <T>(message: T): Promise<unknown> =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });

/**
 * Helper to unwrap BaseResponse and throw on error
 */
const unwrapResponse = <T>(response: { success: boolean; data?: T; error?: { message: string } }): T => {
  if (response.success && response.data !== undefined) {
    return response.data;
  }
  throw new Error(response.error?.message || 'Unknown error');
};

// ============================================================================
// Page Navigation Methods
// ============================================================================

/**
 * Open the options page in a new tab
 */
export const openOptionsPage = async (): Promise<{ success: boolean; tabId?: number }> => {
  const message = {
    type: 'OPEN_EXTENSION_PAGE' as const,
    payload: { page: 'options' as const },
  };
  const response = await sendMessage(message);
  return unwrapResponse(
    response as { success: boolean; data?: { success: boolean; tabId?: number }; error?: { message: string } },
  );
};

/**
 * Open the side panel
 */
export const openSidePanel = async (): Promise<{ success: boolean }> => {
  const message = {
    type: 'OPEN_EXTENSION_PAGE' as const,
    payload: { page: 'side-panel' as const },
  };
  const response = await sendMessage(message);
  return unwrapResponse(response as { success: boolean; data?: { success: boolean }; error?: { message: string } });
};

/**
 * Open the new tab page
 */
export const openNewTabPage = async (): Promise<{ success: boolean; tabId?: number }> => {
  const message = {
    type: 'OPEN_EXTENSION_PAGE' as const,
    payload: { page: 'new-tab' as const },
  };
  const response = await sendMessage(message);
  return unwrapResponse(
    response as { success: boolean; data?: { success: boolean; tabId?: number }; error?: { message: string } },
  );
};

/**
 * Open any extension page
 */
export const openExtensionPage = async (
  page: 'options' | 'new-tab' | 'popup' | 'side-panel' | 'devtools' | 'devtools-panel',
  options?: {
    newWindow?: boolean;
    windowOptions?: {
      type?: 'normal' | 'popup' | 'panel';
      width?: number;
      height?: number;
      left?: number;
      top?: number;
    };
  },
): Promise<{ success: boolean; tabId?: number; windowId?: number }> => {
  const message = {
    type: 'OPEN_EXTENSION_PAGE' as const,
    payload: { page, ...options },
  };
  const response = await sendMessage(message);
  return unwrapResponse(
    response as {
      success: boolean;
      data?: { success: boolean; tabId?: number; windowId?: number };
      error?: { message: string };
    },
  );
};

export const backgroundAPI = {
  openOptionsPage,
  openSidePanel,
  openNewTabPage,
  openExtensionPage,
};

export default backgroundAPI;
