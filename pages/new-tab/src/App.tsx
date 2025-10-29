import ApiKeyModal from './components/ApiKeyModal';
import AppHeader from './components/AppHeader';
import AssetDisplay from './components/AssetDisplay';
import AssetGallery from './components/AssetGallery';
import CreationForm from './components/CreationForm';
import Loader from './components/Loader';
import ScriptDisplay from './components/ScriptDisplay';
import { db } from './db';
import { useAssets } from './hooks/useAssets';
import { useScripts } from './hooks/useScripts';
import { generateScript } from './services/geminiService';
import { useApiKey } from './stores/useApiKey';
import { useTheme } from './stores/useTheme';
import { withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';
import JSZip from 'jszip';
import { useState, useEffect, useMemo } from 'react';
import type { Root, Scene, AspectRatio } from './types';
import type React from 'react';

type ScriptViewMode = 'formatted' | 'json';

const NewTab = () => {
  const [theme, toggleTheme] = useTheme();
  const { apiKey, isApiKeySet } = useApiKey();

  const {
    savedScripts,
    activeScript,
    activeSceneIdentifier,
    scriptsError,
    selectScript,
    newScript,
    deleteActiveScript,
    updateScriptField,
    addScript,
    setActiveSceneIdentifier,
    setActiveScript,
    clearAllData,
    saveActiveScript,
  } = useScripts();

  const [error, setError] = useState<string | null>(null);

  const {
    generateSceneImage,
    cancelGenerateSceneImage,
    generateSceneVideo,
    deleteSceneImage,
    deleteSceneVideo,
    deleteAssetFromGallery,
  } = useAssets(setActiveScript, saveActiveScript, setError);

  // UI and process-specific state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'script' | 'assets'>('script');
  const [scriptViewMode, setScriptViewMode] = useState<ScriptViewMode>('formatted');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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

  const handleNewScript = () => {
    newScript();
    setError(null);
    setCurrentView('script');
    setScriptViewMode('formatted');
  };

  const handleExportData = async () => {
    try {
      const allScripts = await db.scripts.toArray();
      const jsonString = JSON.stringify(allScripts, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinegenie-scripts-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Lỗi xuất dữ liệu:', error);
      setError('Đã xảy ra lỗi trong quá trình xuất dữ liệu kịch bản.');
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Không thể đọc tệp.');
        }
        const importedData = JSON.parse(text);

        const scriptsToImport = Array.isArray(importedData) ? importedData : [importedData];

        const isValidScript = (script: unknown): script is Root =>
          typeof script === 'object' && script !== null && 'title' in script && 'acts' in script;

        if (scriptsToImport.length === 0) {
          setIsImporting(false);
          return;
        }

        if (!scriptsToImport.every(isValidScript)) {
          throw new Error('Tệp không chứa định dạng kịch bản hợp lệ.');
        }

        const scriptsToAdd = scriptsToImport.map(script => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = script;
          return rest;
        });
        await db.scripts.bulkAdd(scriptsToAdd);
        window.location.reload();
      } catch (error) {
        console.error('Lỗi nhập dữ liệu:', error);
        setError(
          `Không thể nhập dữ liệu. ${error instanceof Error ? error.message : 'Tệp có thể bị hỏng hoặc không đúng định dạng.'}`,
        );
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      setError('Đã xảy ra lỗi khi đọc tệp.');
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleExportZip = async () => {
    if (!activeScript) return;
    setIsZipping(true);
    setError(null);
    try {
      const zip = new JSZip();

      const scriptJson = JSON.stringify(activeScript, null, 2);
      zip.file('script.json', scriptJson);

      for (const act of activeScript.acts) {
        for (const scene of act.scenes) {
          if (scene.generatedImageId) {
            const imageRecord = await db.images.get(scene.generatedImageId);
            if (imageRecord?.data) {
              zip.file(`scene_${act.act_number}_${scene.scene_number}.png`, imageRecord.data);
            }
          }
          if (scene.generatedVideoId) {
            const videoRecord = await db.videos.get(scene.generatedVideoId);
            if (videoRecord?.data) {
              zip.file(`scene_${act.act_number}_${scene.scene_number}.mp4`, videoRecord.data);
            }
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      const safeTitle = activeScript.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.href = url;
      a.download = `${safeTitle || 'script'}.zip`;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Lỗi xuất file ZIP:', err);
      setError(err instanceof Error ? err.message : 'Không thể tạo file ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  const activeScene: Scene | null =
    activeScript && activeSceneIdentifier
      ? activeScript.acts[activeSceneIdentifier.actIndex].scenes[activeSceneIdentifier.sceneIndex]
      : null;

  const allScenesFlat = useMemo(() => {
    if (!activeScript) return [];
    return activeScript.acts.flatMap((act, actIndex) =>
      act.scenes.map((scene, sceneIndex) => ({
        identifier: { actIndex, sceneIndex },
        scene: scene,
      })),
    );
  }, [activeScript]);

  const currentSceneLinearIndex = useMemo(() => {
    if (!activeSceneIdentifier || allScenesFlat.length === 0) return -1;
    return allScenesFlat.findIndex(
      s =>
        s.identifier.actIndex === activeSceneIdentifier.actIndex &&
        s.identifier.sceneIndex === activeSceneIdentifier.sceneIndex,
    );
  }, [activeSceneIdentifier, allScenesFlat]);

  const handleGoToPreviousScene = () => {
    if (currentSceneLinearIndex > 0) {
      const prevScene = allScenesFlat[currentSceneLinearIndex - 1];
      setActiveSceneIdentifier(prevScene.identifier);
    }
  };

  const handleGoToNextScene = () => {
    if (currentSceneLinearIndex !== -1 && currentSceneLinearIndex < allScenesFlat.length - 1) {
      const nextScene = allScenesFlat[currentSceneLinearIndex + 1];
      setActiveSceneIdentifier(nextScene.identifier);
    }
  };

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
        <AppHeader
          scripts={savedScripts}
          activeScript={activeScript}
          onSelectScript={selectScript}
          onNewScript={handleNewScript}
          onDeleteActiveScript={deleteActiveScript}
          onClearAllData={clearAllData}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onExportZip={handleExportZip}
          isZipping={isZipping}
          currentView={currentView}
          onViewChange={setCurrentView}
          theme={theme}
          onToggleTheme={toggleTheme}
          scriptViewMode={scriptViewMode}
          onScriptViewModeChange={setScriptViewMode}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

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
                    <ScriptDisplay
                      script={activeScript}
                      onUpdateField={(path, value) => updateScriptField(path, value)}
                      language={'vi-VN'}
                      activeSceneIdentifier={activeSceneIdentifier}
                      onSelectScene={setActiveSceneIdentifier}
                      viewMode={scriptViewMode}
                    />
                  ) : (
                    <CreationForm onGenerate={handleGenerateScript} isLoading={isLoading} />
                  )}
                </div>
              </main>
              {activeScript && (
                <aside className="w-[350px] flex-shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-6 dark:border-slate-700/50 dark:bg-slate-800/50">
                  <AssetDisplay
                    activeScene={activeScene}
                    actIndex={activeSceneIdentifier?.actIndex ?? null}
                    sceneIndex={activeSceneIdentifier?.sceneIndex ?? null}
                    defaultAspectRatio={activeScript?.setting.defaultAspectRatio}
                    onGenerateSceneImage={(actIndex, sceneIndex, finalPrompt, finalNegativePrompt, aspectRatio) =>
                      activeScript &&
                      generateSceneImage(
                        activeScript,
                        actIndex,
                        sceneIndex,
                        finalPrompt,
                        finalNegativePrompt,
                        aspectRatio,
                      )
                    }
                    onCancelGenerateSceneImage={(actIndex, sceneIndex) =>
                      activeScript && cancelGenerateSceneImage(activeScript, actIndex, sceneIndex)
                    }
                    onGenerateSceneVideo={(actIndex, sceneIndex, aspectRatio) =>
                      activeScript && generateSceneVideo(activeScript, actIndex, sceneIndex, aspectRatio)
                    }
                    onDeleteSceneImage={(actIndex, sceneIndex) =>
                      activeScript && deleteSceneImage(activeScript, actIndex, sceneIndex)
                    }
                    onDeleteSceneVideo={(actIndex, sceneIndex) =>
                      activeScript && deleteSceneVideo(activeScript, actIndex, sceneIndex)
                    }
                    isApiKeySet={isApiKeySet()}
                    currentSceneNumber={currentSceneLinearIndex + 1}
                    totalScenes={allScenesFlat.length}
                    onGoToPreviousScene={handleGoToPreviousScene}
                    onGoToNextScene={handleGoToNextScene}
                  />
                </aside>
              )}
            </div>
          ) : (
            <main className="flex-1 overflow-y-auto p-6">
              <AssetGallery onDeleteAsset={deleteAssetFromGallery} />
            </main>
          )}
        </div>
      </div>
    </>
  );
};

export default withErrorBoundary(withSuspense(NewTab, <LoadingSpinner />), ErrorDisplay);
