import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner, ThemeProvider } from '@extension/ui';
import ApiKeyModal from '@src/components/ApiKeyModal';
import AssetDisplay from '@src/components/AssetDisplay';
import CreationForm from '@src/components/CreationForm';
import Loader from '@src/components/Loader';
import ScriptDisplay from '@src/components/ScriptDisplay';
import ScriptHeader from '@src/components/ScriptHeader';
import { useAssets } from '@src/hooks/useAssets';
import { useRouteSync, writeRouteState } from '@src/hooks/useRouteState';
import { generateScript } from '@src/services/geminiService';
import { useApiKey } from '@src/stores/useApiKey';
import { useScriptsStore } from '@src/stores/useScriptsStore';
import { useState, useEffect } from 'react';
import type { AspectRatio } from '@src/types';

const NewTab = () => {
  const { apiKey } = useApiKey();

  // initialize store on mount
  useEffect(() => {
    void useScriptsStore.getState().init();
  }, []);

  // savedScripts retrieved on-demand inside header; not needed here
  const activeScript = useScriptsStore(s => s.activeScript);
  const activeSceneIdentifier = useScriptsStore(s => s.activeSceneIdentifier);
  const scriptsError = useScriptsStore(s => s.scriptsError);
  const selectScript = useScriptsStore(s => s.selectScript);
  const newScript = useScriptsStore(s => s.newScript);
  const addScript = useScriptsStore(s => s.addScript);
  const setActiveSceneIdentifier = useScriptsStore(s => s.setActiveSceneIdentifier);
  const setActiveScript = useScriptsStore(s => s.setActiveScript);
  // clearAllData intentionally unused here; header handles destructive actions
  const saveActiveScript = useScriptsStore(s => s.saveActiveScript);

  const [error, setError] = useState<string | null>(null);

  // initialize asset helpers (we don't need the returned functions here)
  void useAssets(setActiveScript, saveActiveScript, setError);

  // UI and process-specific state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isImporting = useScriptsStore(s => s.isImporting);
  const isSettingsModalOpen = useScriptsStore(s => s.settingsModalOpen);
  const setIsSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);
  const currentView = useScriptsStore(s => s.currentView);
  const setCurrentView = useScriptsStore(s => s.setCurrentView);
  const scriptViewMode = useScriptsStore(s => s.scriptViewMode);
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

  const handleGenerateScript = async (prompt: string, language: 'en-US' | 'vi-VN', aspectRatio: AspectRatio) => {
    setIsLoading(true);
    setError(null);
    newScript(); // Reset active script via hook

    try {
      if (!apiKey) throw new Error('API key is not set.');
      const generatedScript = await generateScript(prompt, language, apiKey);
      generatedScript.setting.defaultAspectRatio = aspectRatio;
      await addScript(generatedScript);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsLoading(false);
    }
  };

  // export/import/zip handlers moved into the store; header now triggers them directly

  // navigation helpers moved into components that consume the store directly

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      {error && <div className="error">{error}</div>}
      <ApiKeyModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
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
      <ScriptHeader />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="flex h-full">
          <main className="flex-1 overflow-y-auto p-6">
            <div className={activeScript ? 'mx-auto max-w-4xl' : 'mx-auto max-w-2xl'}>
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader />
                </div>
              ) : activeScript ? (
                <ScriptDisplay script={activeScript} language={'vi-VN'} viewMode={scriptViewMode} />
              ) : (
                <CreationForm onGenerate={handleGenerateScript} isLoading={isLoading} />
              )}
            </div>
          </main>

          {activeScript && (
            <aside className="w-[350px] flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-6 dark:border-slate-700/50 dark:bg-slate-800/50">
              <AssetDisplay />
            </aside>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
};

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
