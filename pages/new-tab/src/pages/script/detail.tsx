import { withErrorBoundary, withSuspense } from '@extension/shared';
import { Button, ErrorDisplay, LoadingSpinner, Tabs, TabsContent, TabsList, TabsTrigger } from '@extension/ui';
import AudioPlayer from '@src/components/script/audio-player';
import ModelSettingsModal from '@src/components/script/model-settings-modal';
import AssetDisplay from '@src/components/script/script-asset-display';
import ScriptDisplay from '@src/components/script/script-display';
import ScriptHeader from '@src/components/script/script-header';
import ScriptTtsExportModal from '@src/components/script/script-tts-export-modal';
import { QUERIES } from '@src/constants';
import { useAssets } from '@src/hooks/use-assets';
import { useMediaQuery } from '@src/hooks/use-media-query';
import { useStoreHydration } from '@src/hooks/use-store-hydration';
import { useApiKey } from '@src/stores/use-api-key';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

const ScriptDetailPage = () => {
  useEffect(() => {
    void useApiKey.getState().loadApiKey();
  }, []);

  const hasHydrated = useStoreHydration();
  const { id: idFromUrl } = useParams<{ id: string }>();
  const activeScript = useScriptsStore(s => s.activeScript);
  const scriptsError = useScriptsStore(s => s.scriptsError);
  const selectScript = useScriptsStore(s => s.selectScript);
  const setActiveScript = useScriptsStore(s => s.setActiveScript);
  const saveActiveScript = useScriptsStore(s => s.saveActiveScript);
  const [error, setError] = useState<string | null>(null);

  const [isTtsModalOpen, setIsTtsModalOpen] = useState(false);
  // initialize asset helpers (we don't need the returned functions here)
  void useAssets(setActiveScript, saveActiveScript, setError);

  // UI and process-specific state
  const isImporting = useScriptsStore(s => s.isImporting);
  const scriptViewMode = useScriptsStore(s => s.scriptViewMode);
  const isModelSettingsOpen = useScriptsStore(s => s.modelSettingsModalOpen);
  const setModelSettingsModalOpen = useScriptsStore(s => s.setModelSettingsModalOpen);
  // modal state is managed in the store

  const isMobile = useMediaQuery(QUERIES['2xl']);

  // Effect to sync script errors with the main error state
  useEffect(() => {
    setError(scriptsError);
  }, [scriptsError]);

  // Đồng bộ state với URL.
  // Hook này sẽ chạy khi component được mount, hoặc khi id trên URL thay đổi.
  useEffect(() => {
    if (hasHydrated) {
      const scriptIdFromUrl = idFromUrl ? parseInt(idFromUrl, 10) : null;
      if (scriptIdFromUrl !== null) selectScript(scriptIdFromUrl);
    }
  }, [idFromUrl, hasHydrated, selectScript]);

  const NoScriptFallback = () => (
    <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
      <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Chưa có kịch bản nào được chọn</h3>
      <p className="mt-1 text-sm">Vui lòng chọn một kịch bản từ danh sách hoặc tạo một kịch bản mới.</p>
      <Link className="mt-4" to="/script/new">
        <Button>Tạo kịch bản mới</Button>
      </Link>
    </div>
  );

  // Hiển thị loading spinner nếu URL có ID nhưng activeScript chưa khớp
  // Điều này ngăn việc hiển thị NoScriptFallback trong lúc chuyển trang
  if (!hasHydrated) {
    // Nếu store chưa hydrate, luôn hiển thị loading
    return <LoadingSpinner />;
  }

  const urlScriptId = idFromUrl ? parseInt(idFromUrl, 10) : null;
  const isSyncingRoute = urlScriptId !== null && activeScript?.id !== urlScriptId;
  if (isSyncingRoute) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <AudioPlayer />
      {activeScript && (
        <ModelSettingsModal
          isOpen={isModelSettingsOpen}
          onClose={() => setModelSettingsModalOpen(false)}
          onSave={() => {}}
        />
      )}
      {activeScript && <ScriptTtsExportModal isOpen={isTtsModalOpen} onClose={() => setIsTtsModalOpen(false)} />}

      <ScriptHeader />
      {error && <div className="error">{error}</div>}
      {isImporting && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 text-center backdrop-blur-sm"
          aria-modal="true"
          role="dialog">
          <div className="border-t-primary h-12 w-12 animate-spin rounded-full border-4 border-slate-300"></div>
          <h4 className="mt-6 text-lg font-semibold text-white">Đang nhập dữ liệu...</h4>
          <p className="text-slate-300">Ứng dụng sẽ sớm được tải lại.</p>
        </div>
      )}

      <div className="bg-background min-h-screen">
        {!activeScript ? (
          <div className="p-6">
            <NoScriptFallback />
          </div>
        ) : isMobile ? (
          // Mobile View: Tabs
          <div className="p-4">
            <Tabs defaultValue="script" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="script">Kịch bản</TabsTrigger>
                <TabsTrigger value="assets">Tài sản</TabsTrigger>
              </TabsList>
              <TabsContent value="script" className="mt-4">
                <ScriptDisplay script={activeScript} language={'vi-VN'} viewMode={scriptViewMode} />
              </TabsContent>
              <TabsContent value="assets" className="mt-4">
                <AssetDisplay onGenerateTts={() => setIsTtsModalOpen(true)} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // Desktop View: 2 Columns
          <div className="flex h-full">
            <main className="flex-1 p-6">
              <div className="mx-auto">
                <ScriptDisplay script={activeScript} language={'vi-VN'} viewMode={scriptViewMode} />
              </div>
            </main>
            <aside
              className="scrollbar-hidden sticky top-0 h-[calc(100vh-4rem)] w-[500px] flex-shrink-0 overflow-y-auto p-6"
              style={{ alignSelf: 'flex-start' }}>
              <AssetDisplay onGenerateTts={() => setIsTtsModalOpen(true)} />
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(ScriptDetailPage, <LoadingSpinner />), ErrorDisplay);
