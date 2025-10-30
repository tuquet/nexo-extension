import ApiKeyModal from './components/ApiKeyModal';
import AssetDisplay from './components/AssetDisplay';
import AssetGallery from './components/AssetGallery';
import CreationForm from './components/CreationForm';
import Loader from './components/Loader';
import ScriptDisplay from './components/ScriptDisplay';
import ScriptHeader from './components/ScriptHeader';
import { generateScript } from './services/geminiService';
import { useApiKey } from './stores/useApiKey';
import { useScriptsStore } from './stores/useScriptsStore';
import { useTheme } from './stores/useTheme';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';
import { useState, useEffect } from 'react';
import type { AspectRatio } from './types';

const NewTab = () => {
  // theme toggle currently unused in NewTab; keep the hook for later use
  void useTheme();
  const { apiKey } = useApiKey();

  useEffect(() => {
    void useScriptsStore.getState().init();
  }, []);

  const activeScript = useScriptsStore(s => s.activeScript);
  const scriptsError = useScriptsStore(s => s.scriptsError);
  const newScript = useScriptsStore(s => s.newScript);
  const addScript = useScriptsStore(s => s.addScript);

  const [error, setError] = useState<string | null>(null);

  // UI and process-specific state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isImporting = useScriptsStore(s => s.isImporting);
  const isSettingsModalOpen = useScriptsStore(s => s.settingsModalOpen);
  const setIsSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);
  // currentView moved to store
  const currentView = useScriptsStore(s => s.currentView);
  // script view mode moved to store
  const scriptViewMode = useScriptsStore(s => s.scriptViewMode);
  // settings modal is driven by the store

  // Effect to sync script errors with the main error state
  useEffect(() => {
    setError(scriptsError);
  }, [scriptsError]);

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

  // import/export/zip now handled by the store; header triggers these actions directly

  // Navigation logic was moved into ScriptDisplay/AssetDisplay which use the store directly

  return (
    <>
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
      <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-900">
        <ScriptHeader />

        <div className="flex flex-1 overflow-hidden">
          {currentView === 'script' ? (
            <div className="flex flex-1 overflow-hidden">
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
          ) : (
            <main className="flex-1 overflow-y-auto p-6">
              <AssetGallery />
            </main>
          )}
        </div>
      </div>
    </>
  );
};

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
