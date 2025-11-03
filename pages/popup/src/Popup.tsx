import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import {
  cn,
  ErrorDisplay,
  LoadingSpinner,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from '@extension/ui';
import {
  FileText,
  Image,
  Sparkles,
  Settings,
  PanelLeftOpen,
  PanelRightClose,
  ExternalLink,
  Maximize2,
  AppWindow,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const Popup = () => {
  const { isLight } = useStorage(exampleThemeStorage);
  const [isPanelEnabled, setIsPanelEnabled] = useState(false);

  // Khi popup mở, kiểm tra trạng thái của side panel
  useEffect(() => {
    const checkPanelState = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        try {
          const { enabled } = await chrome.sidePanel.getOptions({ tabId: tab.id });
          setIsPanelEnabled(!!enabled);
        } catch (error) {
          console.error('Failed to check panel state:', error);
        }
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
      window.close(); // Đóng popup sau khi mở tab
      return;
    }

    const tabs = await chrome.tabs.query({ url: newTabUrl });

    if (tabs.length > 0 && tabs[0].id) {
      // Kích hoạt tab đã tồn tại và focus vào cửa sổ của nó
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
      window.close(); // Đóng popup
    } else {
      // Tạo tab mới nếu chưa có
      await chrome.tabs.create({ url: newTabUrl });
      window.close(); // Đóng popup
    }
  };

  const openExtensionPage = async (page: 'scripts' | 'assets' | 'prompts') => {
    const newTabUrl = chrome.runtime.getURL('new-tab/index.html');
    const pageHash = {
      scripts: '#/script',
      assets: '#/asset',
      prompts: '#/prompts',
    };

    const fullUrl = `${newTabUrl}${pageHash[page]}`;
    await chrome.tabs.create({ url: fullUrl });
    window.close(); // Đóng popup
  };

  const toggleSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;

    try {
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
    } catch (error) {
      console.error('Failed to toggle side panel:', error);
    }
  };

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
    window.close(); // Đóng popup
  };

  const openNewTabInWindow = async () => {
    const newTabUrl = chrome.runtime.getURL('new-tab/index.html');
    await chrome.windows.create({
      url: newTabUrl,
      type: 'popup',
      width: 1200,
      height: 800,
    });
    window.close(); // Đóng popup
  };

  return (
    <div
      className={cn(
        'flex h-[600px] max-h-[600px] w-[340px] flex-col overflow-hidden',
        isLight ? 'bg-background' : 'bg-background',
      )}>
      {/* Header */}
      <div className="from-primary/10 to-primary/5 shrink-0 border-b bg-gradient-to-r px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg font-bold">
            CG
          </div>
          <div>
            <h1 className="text-sm font-semibold">CineGenie</h1>
            <p className="text-muted-foreground text-xs">AI Script Generator</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Access main features quickly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Button
              onClick={() => void openExtensionPage('scripts')}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2">
              <FileText className="size-4" />
              <span className="flex-1 text-left">Kịch Bản</span>
              <ExternalLink className="size-3 opacity-50" />
            </Button>
            <Button
              onClick={() => void openExtensionPage('assets')}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2">
              <Image className="size-4" />
              <span className="flex-1 text-left">Tài Sản</span>
              <ExternalLink className="size-3 opacity-50" />
            </Button>
            <Button
              onClick={() => void openExtensionPage('prompts')}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2">
              <Sparkles className="size-4" />
              <span className="flex-1 text-left">Prompts</span>
              <ExternalLink className="size-3 opacity-50" />
            </Button>
          </CardContent>
        </Card>

        {/* Tools */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tools & Settings</CardTitle>
            <CardDescription className="text-xs">Extension management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <Button
              onClick={() => void openNewTab()}
              variant="default"
              size="sm"
              className="w-full justify-start gap-2">
              <Maximize2 className="size-4" />
              <span className="flex-1 text-left">Mở Giao Diện Chính</span>
            </Button>
            <Button
              onClick={() => void openNewTabInWindow()}
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2">
              <AppWindow className="size-4" />
              <span className="flex-1 text-left">Mở Cửa Sổ Riêng</span>
            </Button>
            <Separator className="my-2" />
            <Button onClick={toggleSidePanel} variant="outline" size="sm" className="w-full justify-start gap-2">
              {isPanelEnabled ? <PanelRightClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
              <span className="flex-1 text-left">{isPanelEnabled ? 'Đóng Thanh Bên' : 'Mở Thanh Bên'}</span>
            </Button>
            <Separator className="my-2" />
            <Button onClick={openOptionsPage} variant="outline" size="sm" className="w-full justify-start gap-2">
              <Settings className="size-4" />
              <span className="flex-1 text-left">Cài Đặt</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-4 py-2">
        <p className="text-muted-foreground text-center text-xs">v0.5.0 • CineGenie Extension</p>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
