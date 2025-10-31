import ImageGenerationModal from './image-generation-modal';
import SceneAssetCard from './script-scene-asset-card';
import { DEFAULT_IMAGE_NEGATIVE_PROMPT, IMAGE_GENERATION_MODEL, VIDEO_GENERATION_MODEL } from '../../constants';
import { useAssets } from '../../hooks/use-assets';
import { useApiKey } from '../../stores/use-api-key';
import { useScriptsStore } from '../../stores/use-scripts-store';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@extension/ui';
import { useState } from 'react';
import type { AspectRatio } from '../../types';
import type React from 'react';

const AssetDisplay: React.FC = () => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalConfig, setImageModalConfig] = useState<{
    actIndex: number;
    sceneIndex: number;
    initialPrompt: string;
    initialNegativePrompt: string;
    initialAspectRatio: AspectRatio;
  } | null>(null);

  // read active script + scene from store
  const activeScript = useScriptsStore(s => s.activeScript);
  const activeSceneIdentifier = useScriptsStore(s => s.activeSceneIdentifier);
  const setActiveScript = useScriptsStore(s => s.setActiveScript);
  const saveActiveScript = useScriptsStore(s => s.saveActiveScript);
  const updateScriptField = useScriptsStore(s => s.updateScriptField);

  const apiKey = useApiKey.getState().apiKey;

  const { generateSceneImage, cancelGenerateSceneImage, generateSceneVideo, deleteSceneImage, deleteSceneVideo } =
    useAssets(setActiveScript, saveActiveScript, () => {});

  const actIndex = activeSceneIdentifier?.actIndex ?? null;
  const sceneIndex = activeSceneIdentifier?.sceneIndex ?? null;
  const activeScene =
    activeScript && actIndex !== null && sceneIndex !== null ? activeScript.acts[actIndex].scenes[sceneIndex] : null;
  const defaultAspectRatio = activeScript?.setting.defaultAspectRatio;
  const isApiKeySet = !!apiKey;

  const totalScenes = activeScript ? activeScript.acts.flatMap(a => a.scenes).length : 0;
  const currentSceneNumber = (() => {
    if (!activeScript || !activeSceneIdentifier) return 0;
    const flat = activeScript.acts.flatMap((a, ai) => a.scenes.map((s, si) => ({ ai, si })));
    const idx = flat.findIndex(
      x => x.ai === activeSceneIdentifier.actIndex && x.si === activeSceneIdentifier.sceneIndex,
    );
    return idx === -1 ? 0 : idx + 1;
  })();

  const handleOpenImageModal = (modalActIndex: number, modalSceneIndex: number, initialAspectRatio: AspectRatio) => {
    if (!activeScene) return;
    const initialPrompt = `Cinematic shot of ${activeScene.location} at ${activeScene.time}. ${activeScene.action}. Visual style: ${activeScene.visual_style}.`;
    setImageModalConfig({
      actIndex: modalActIndex,
      sceneIndex: modalSceneIndex,
      initialPrompt,
      initialNegativePrompt: DEFAULT_IMAGE_NEGATIVE_PROMPT,
      initialAspectRatio,
    });
    setIsImageModalOpen(true);
  };

  const handleImageModalSubmit = (finalPrompt: string, finalNegativePrompt: string, finalAspectRatio: AspectRatio) => {
    if (imageModalConfig) {
      generateSceneImage(
        activeScript!,
        imageModalConfig.actIndex,
        imageModalConfig.sceneIndex,
        finalPrompt,
        finalNegativePrompt,
        activeScript?.setting.defaultImageModel || IMAGE_GENERATION_MODEL,
        finalAspectRatio,
      );
    }
    setIsImageModalOpen(false);
    setImageModalConfig(null);
  };

  const noScriptOrSceneFallback = (
    <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
      <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-200">Tài sản kịch bản</h3>
      <p className="text-sm">
        Chọn hoặc tạo một kịch bản, sau đó chọn một cảnh từ trình biên tập để bắt đầu tạo tài sản.
      </p>
    </div>
  );

  if (!activeScene || actIndex === null || sceneIndex === null) {
    return noScriptOrSceneFallback;
  }

  return (
    <>
      {imageModalConfig && (
        <ImageGenerationModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onSubmit={handleImageModalSubmit}
          initialPrompt={imageModalConfig.initialPrompt}
          initialNegativePrompt={imageModalConfig.initialNegativePrompt}
          initialAspectRatio={imageModalConfig.initialAspectRatio}
          isGenerating={!!activeScene.isGeneratingImage}
        />
      )}
      <Card className="space-y-6">
        <CardHeader>
          <CardTitle>Cảnh {activeScene.scene_number}</CardTitle>
          <CardDescription>{activeScene.location}</CardDescription>
          <CardAction>
            {totalScenes > 0 && (
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => {
                    // go to previous scene using store setter
                    const flat = activeScript?.acts.flatMap((a, ai) => a.scenes.map((s, si) => ({ ai, si }))) ?? [];
                    const curIndex = flat.findIndex(x => x.ai === actIndex && x.si === sceneIndex);
                    if (curIndex > 0) {
                      const prev = flat[curIndex - 1];
                      useScriptsStore.getState().setActiveSceneIdentifier({ actIndex: prev.ai, sceneIndex: prev.si });
                    }
                  }}
                  disabled={currentSceneNumber <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                  aria-label="Cảnh trước"
                  title="Cảnh trước">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium tabular-nums text-slate-600 dark:text-slate-400">
                  {currentSceneNumber}/{totalScenes}
                </span>
                <button
                  onClick={() => {
                    const flat = activeScript?.acts.flatMap((a, ai) => a.scenes.map((s, si) => ({ ai, si }))) ?? [];
                    const curIndex = flat.findIndex(x => x.ai === actIndex && x.si === sceneIndex);
                    if (curIndex !== -1 && curIndex < flat.length - 1) {
                      const next = flat[curIndex + 1];
                      useScriptsStore.getState().setActiveSceneIdentifier({ actIndex: next.ai, sceneIndex: next.si });
                    }
                  }}
                  disabled={currentSceneNumber >= totalScenes}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                  aria-label="Cảnh tiếp theo"
                  title="Cảnh tiếp theo">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          <SceneAssetCard
            scriptId={activeScript?.id}
            scene={activeScene!}
            actIndex={actIndex!}
            sceneIndex={sceneIndex!}
            onOpenImageModal={handleOpenImageModal}
            onCancelGenerateImage={(ai, si) => cancelGenerateSceneImage(activeScript!, ai, si)}
            onDeleteImage={(ai, si) => deleteSceneImage(activeScript!, ai, si)}
            onUpdateSceneImage={(ai, si, imageId) =>
              updateScriptField(`acts[${ai}].scenes[${si}].generatedImageId`, imageId)
            }
            onUpdateSceneVideo={(ai, si, videoId) =>
              updateScriptField(`acts[${ai}].scenes[${si}].generatedVideoId`, videoId)
            }
            onGenerateVideo={(ai, si, ar) =>
              generateSceneVideo(
                activeScript!,
                ai,
                si,
                activeScript?.setting.defaultVideoModel || VIDEO_GENERATION_MODEL,
                ar,
              )
            }
            onDeleteVideo={(ai, si) => deleteSceneVideo(activeScript!, ai, si)}
            defaultAspectRatio={defaultAspectRatio}
            isApiKeySet={isApiKeySet}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default AssetDisplay;
