import '@src/Popup.css';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { useEffect } from 'react';

const Popup = () => {
  useEffect(() => {
    // Auto-open new-tab when popup is clicked
    const openNewTab = async () => {
      const newTabUrl = chrome.runtime.getURL('new-tab/index.html');
      const tabs = await chrome.tabs.query({ url: newTabUrl });

      if (tabs.length > 0 && tabs[0].id) {
        // Focus existing tab
        await chrome.tabs.update(tabs[0].id, { active: true });
        await chrome.windows.update(tabs[0].windowId, { focused: true });
      } else {
        // Create new tab
        await chrome.tabs.create({ url: newTabUrl });
      }

      window.close();
    };

    void openNewTab();
  }, []);

  return (
    <div className="flex h-20 w-20 items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
