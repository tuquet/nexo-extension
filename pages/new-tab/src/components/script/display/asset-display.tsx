import SceneAsset from '../cards/scene-asset';
import TtsAsset from '../cards/tts-asset';
import ImageGenerationModal from '../modals/image-generation';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@extension/ui';
import { DEFAULT_IMAGE_NEGATIVE_PROMPT } from '@src/constants';
import { useAssets } from '@src/hooks/use-assets';
import { useApiKey } from '@src/stores/use-api-key';
import { useModelSettings } from '@src/stores/use-model-settings';
import { usePreferencesStore } from '@src/stores/use-preferences-store';
import {
  useScriptsStore,
  selectActiveScene,
  selectTotalScenesCount,
  selectCurrentSceneNumber,
  selectNextSceneIdentifier,
  selectPreviousSceneIdentifier,
} from '@src/stores/use-scripts-store';
import { useState } from 'react';
import type { AspectRatio } from '@src/types';
import type React from 'react';

interface AssetDisplayProps {
  onGenerateTts: () => void;
  setError: (error: string | null) => void;
}

const AssetDisplay: React.FC<AssetDisplayProps> = ({ onGenerateTts, setError }) => {
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
  const setActiveSceneIdentifier = useScriptsStore(s => s.setActiveSceneIdentifier);

  // Use selectors to get derived data
  const activeScene = useScriptsStore(selectActiveScene);
  const totalScenes = useScriptsStore(selectTotalScenesCount);
  const currentSceneNumber = useScriptsStore(selectCurrentSceneNumber);
  const nextSceneId = useScriptsStore(selectNextSceneIdentifier);
  const prevSceneId = useScriptsStore(selectPreviousSceneIdentifier);

  const apiKey = useApiKey.getState().apiKey;
  const { imageModel, videoModel } = useModelSettings();
  const defaultAspectRatio = usePreferencesStore(s => s.defaultAspectRatio);

  const { generateSceneImage, cancelGenerateSceneImage, generateSceneVideo, deleteSceneImage, deleteSceneVideo } =
    useAssets(setError);

  const isApiKeySet = !!apiKey;

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
        imageModel,
        finalAspectRatio,
      );
    }
    setIsImageModalOpen(false);
    setImageModalConfig(null);
  };

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
          isGenerating={!!activeScene?.isGeneratingImage}
        />
      )}
      <Card>
        {activeScript && activeScene ? (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Cảnh {activeScene.scene_number}</CardTitle>
              <CardDescription>{activeScene.location}</CardDescription>
              <CardAction>
                {totalScenes > 0 && (
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <button
                      onClick={() => prevSceneId && setActiveSceneIdentifier(prevSceneId)}
                      disabled={!prevSceneId}
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
                      onClick={() => nextSceneId && setActiveSceneIdentifier(nextSceneId)}
                      disabled={!nextSceneId}
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
              <SceneAsset
                scriptId={activeScript.id}
                scene={activeScene}
                actIndex={activeScene.actIndex}
                sceneIndex={activeScene.sceneIndex}
                onOpenImageModal={handleOpenImageModal}
                onCancelGenerateImage={(ai, si) => cancelGenerateSceneImage(activeScript, ai, si)}
                onDeleteImage={(ai, si) => deleteSceneImage(activeScript, ai, si)}
                onGenerateVideo={(ai, si, ar) => generateSceneVideo(activeScript!, ai, si, videoModel, ar)}
                onDeleteVideo={(ai, si) => deleteSceneVideo(activeScript, ai, si)}
                defaultAspectRatio={defaultAspectRatio}
                isApiKeySet={isApiKeySet}
              />
            </CardContent>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            <p>Chọn một cảnh để quản lý tài sản hình ảnh và video.</p>
          </div>
        )}
        {activeScript && (
          <>
            <div className="border-t border-slate-200 dark:border-slate-700"></div>
            <div className="p-6">
              <TtsAsset onGenerateTts={onGenerateTts} script={activeScript} />
            </div>
          </>
        )}
      </Card>
    </>
  );
};

export default AssetDisplay;
