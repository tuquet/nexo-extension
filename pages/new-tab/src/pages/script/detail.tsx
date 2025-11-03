import { withErrorBoundary, withSuspense } from '@extension/shared';
import { Button, ErrorDisplay, LoadingSpinner } from '@extension/ui';
import AssetDisplay from '@src/components/script/display/asset-display';
import ScriptContent from '@src/components/script/display/content';
import Header from '@src/components/script/display/header';
import ResponsiveDetailLayout from '@src/components/script/display/responsive-detail-layout';
import ModelSettings from '@src/components/script/modals/model-settings';
import TtsExport from '@src/components/script/modals/tts-export';
import AudioPlayer from '@src/components/script/ui/audio-player';
import { useAssets } from '@src/hooks/use-assets';
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
  const [error, setError] = useState<string | null>(null);

  const [isTtsModalOpen, setIsTtsModalOpen] = useState(false);
  // initialize asset helpers (we don't need the returned functions here)
  void useAssets(setError);

  // UI and process-specific state
  const isImporting = useScriptsStore(s => s.isImporting);
  const scriptViewMode = useScriptsStore(s => s.scriptViewMode);
  const isModelSettingsOpen = useScriptsStore(s => s.modelSettingsModalOpen);
  const setModelSettingsModalOpen = useScriptsStore(s => s.setModelSettingsModalOpen);
  // modal state is managed in the store

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
        <ModelSettings
          isOpen={isModelSettingsOpen}
          onClose={() => setModelSettingsModalOpen(false)}
          onSave={() => {}}
        />
      )}
      {activeScript && <TtsExport isOpen={isTtsModalOpen} onClose={() => setIsTtsModalOpen(false)} />}

      <Header />
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
        ) : (
          <ResponsiveDetailLayout
            scriptContent={<ScriptContent script={activeScript} language={'vi-VN'} viewMode={scriptViewMode} />}
            assetContent={<AssetDisplay onGenerateTts={() => setIsTtsModalOpen(true)} setError={setError} />}
          />
        )}
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(ScriptDetailPage, <LoadingSpinner />), ErrorDisplay);
