import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner, Button } from '@extension/ui';
import { LayoutDashboard, PanelLeftOpen, PanelRightClose, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

const Popup = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const [isPanelEnabled, setIsPanelEnabled] = useState(false);

  // Khi popup mở, kiểm tra trạng thái của side panel
  useEffect(() => {
    const checkPanelState = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const { enabled } = await chrome.sidePanel.getOptions({ tabId: tab.id });
        setIsPanelEnabled(!!enabled);
      }
    };
    void checkPanelState();
  }, []);

  /**
   * Mở trang giao diện chính.
   * Kiểm tra xem tab đã tồn tại chưa, nếu có thì kích hoạt nó.
   * Nếu không, tạo một tab mới.
   * @param forceNew - Nếu là true, luôn tạo một tab mới.
   */
  const openNewTab = async (forceNew = false) => {
    const newTabUrl = chrome.runtime.getURL('new-tab/index.html');

    if (forceNew) {
      await chrome.tabs.create({ url: newTabUrl });
      return;
    }

    const tabs = await chrome.tabs.query({ url: newTabUrl });

    if (tabs.length > 0 && tabs[0].id) {
      // Kích hoạt tab đã tồn tại và focus vào cửa sổ của nó
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      // Tạo tab mới nếu chưa có
      await chrome.tabs.create({ url: newTabUrl });
    }
  };

  const toggleSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    if (isPanelEnabled) {
      // Nếu đang bật, tắt nó đi
      await chrome.sidePanel.setOptions({ tabId: tab.id, enabled: false });
      setIsPanelEnabled(false);
    } else {
      // Nếu đang tắt, bật nó lên
      await chrome.sidePanel.setOptions({ tabId: tab.id, path: '/side-panel/index.html', enabled: true });
      // Và mở nó trong cửa sổ hiện tại
      await chrome.sidePanel.open({ windowId: tab.windowId });
      setIsPanelEnabled(true);
    }
  };

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className={cn('h-screen w-full', isLight ? 'bg-slate-50' : 'bg-gray-800')}>
      <div className="flex w-full flex-col space-y-3 p-4">
        {/* Main Navigation */}
        <Button onClick={() => void openNewTab()} variant="outline" className="w-full justify-start">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Mở giao diện chính
        </Button>

        {/* Tools */}
        <Button onClick={toggleSidePanel} variant="outline" className="w-full justify-start">
          {isPanelEnabled ? <PanelRightClose className="mr-2 h-4 w-4" /> : <PanelLeftOpen className="mr-2 h-4 w-4" />}
          <span>{isPanelEnabled ? 'Đóng thanh bên' : 'Mở thanh bên'}</span>
        </Button>

        <Button onClick={openOptionsPage} variant="outline" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Mở trang tùy chọn
        </Button>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
