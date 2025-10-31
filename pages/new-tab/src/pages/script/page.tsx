import { withErrorBoundary, withSuspense } from '@extension/shared';
import { Button, ErrorDisplay, LoadingSpinner } from '@extension/ui';
import ModelSettingsModal from '@src/components/script/model-settings-modal';
import AssetDisplay from '@src/components/script/script-asset-display';
import ScriptDisplay from '@src/components/script/script-display';
import ScriptHeader from '@src/components/script/script-header';
import { useAssets } from '@src/hooks/use-assets';
import { useRouteSync, writeRouteState } from '@src/hooks/use-route-state';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const NewTab = () => {
  // initialize store on mount
  useEffect(() => {
    void useScriptsStore.getState().init();
  }, []);

  // savedScripts retrieved on-demand inside header; not needed here
  const activeScript = useScriptsStore(s => s.activeScript);
  const activeSceneIdentifier = useScriptsStore(s => s.activeSceneIdentifier);
  const scriptsError = useScriptsStore(s => s.scriptsError);
  const selectScript = useScriptsStore(s => s.selectScript);
  const setActiveSceneIdentifier = useScriptsStore(s => s.setActiveSceneIdentifier);
  const setActiveScript = useScriptsStore(s => s.setActiveScript);
  // clearAllData intentionally unused here; header handles destructive actions
  const updateScriptField = useScriptsStore(s => s.updateScriptField);
  const saveActiveScript = useScriptsStore(s => s.saveActiveScript);

  const [error, setError] = useState<string | null>(null);

  // initialize asset helpers (we don't need the returned functions here)
  void useAssets(setActiveScript, saveActiveScript, setError);

  // UI and process-specific state
  const isImporting = useScriptsStore(s => s.isImporting);

  const currentView = useScriptsStore(s => s.currentView);
  const setCurrentView = useScriptsStore(s => s.setCurrentView);
  const scriptViewMode = useScriptsStore(s => s.scriptViewMode);
  const isModelSettingsOpen = useScriptsStore(s => s.modelSettingsModalOpen);
  const setModelSettingsModalOpen = useScriptsStore(s => s.setModelSettingsModalOpen);
  // modal state is managed in the store

  // Effect to sync script errors with the main error state
  useEffect(() => {
    setError(scriptsError);
  }, [scriptsError]);

  // Initialize from URL on first render and wire popstate
  useRouteSync(initial => {
    if (initial.view) setCurrentView(initial.view);
    if (initial.scriptId != null) selectScript(initial.scriptId);
    if (initial.actIndex != null && initial.sceneIndex != null)
      setActiveSceneIdentifier({ actIndex: initial.actIndex, sceneIndex: initial.sceneIndex });
  });

  // Write route on relevant state changes
  useEffect(() => {
    writeRouteState({
      view: currentView,
      scriptId: activeScript?.id ?? null,
      actIndex: activeSceneIdentifier?.actIndex ?? null,
      sceneIndex: activeSceneIdentifier?.sceneIndex ?? null,
    });
  }, [currentView, activeScript?.id, activeSceneIdentifier]);

  const handleSaveModelSettings = (newSettings: { imageModel: string; videoModel: string }) => {
    void updateScriptField('setting.defaultImageModel', newSettings.imageModel);
    void updateScriptField('setting.defaultVideoModel', newSettings.videoModel);
  };

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

  return (
    <div>
      {activeScript && (
        <ModelSettingsModal
          isOpen={isModelSettingsOpen}
          onClose={() => setModelSettingsModalOpen(false)}
          script={activeScript}
          onSave={handleSaveModelSettings}
        />
      )}
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
        <div className="flex h-full">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto">
              {activeScript ? (
                <ScriptDisplay script={activeScript} language={'vi-VN'} viewMode={scriptViewMode} />
              ) : (
                <NoScriptFallback />
              )}
            </div>
          </main>

          {activeScript && (
            <aside className="w-[450px] flex-shrink-0 overflow-y-auto p-6">
              <AssetDisplay />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
