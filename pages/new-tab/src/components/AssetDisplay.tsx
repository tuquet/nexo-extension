import ImageGenerationModal from './ImageGenerationModal';
import { VIDEO_LOADING_MESSAGES, DEFAULT_ASPECT_RATIO, DEFAULT_IMAGE_NEGATIVE_PROMPT } from '../constants';
import { db } from '../db';
import { useAssets } from '../hooks/useAssets';
import { useApiKey } from '../stores/useApiKey';
import { useScriptsStore } from '../stores/useScriptsStore';
import { useState, useEffect } from 'react';
import type { Scene, AspectRatio } from '../types';
import type React from 'react';

// AssetDisplay now reads active script/scene from the centralized store and uses the shared useAssets
// utility internally so components no longer need many props.

const SceneAssetCard: React.FC<{
  scene: Scene;
  actIndex: number;
  sceneIndex: number;
  onOpenImageModal: (actIndex: number, sceneIndex: number, initialAspectRatio: AspectRatio) => void;
  onCancelGenerateImage: (actIndex: number, sceneIndex: number) => void;
  onDeleteImage: (actIndex: number, sceneIndex: number) => void;
  onGenerateVideo: (actIndex: number, sceneIndex: number, aspectRatio: AspectRatio) => void;
  onDeleteVideo: (actIndex: number, sceneIndex: number) => void;
  defaultAspectRatio?: AspectRatio;
  isApiKeySet: boolean;
}> = ({
  scene,
  actIndex,
  sceneIndex,
  onOpenImageModal,
  onCancelGenerateImage,
  onDeleteImage,
  onGenerateVideo,
  onDeleteVideo,
  defaultAspectRatio,
  isApiKeySet,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(defaultAspectRatio || DEFAULT_ASPECT_RATIO);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const loadImage = async () => {
      if (scene.generatedImageId) {
        try {
          const imageRecord = await db.images.get(scene.generatedImageId);
          if (imageRecord?.data) {
            objectUrl = URL.createObjectURL(imageRecord.data);
            setImageUrl(objectUrl);
          } else {
            setImageUrl(null);
          }
        } catch (error) {
          console.error('Lỗi tải ảnh từ DB:', error);
          setImageUrl(null);
        }
      } else {
        setImageUrl(null);
      }
    };
    loadImage();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [scene.generatedImageId]);

  useEffect(() => {
    let objectUrl: string | null = null;
    const loadVideo = async () => {
      if (scene.generatedVideoId) {
        try {
          const videoRecord = await db.videos.get(scene.generatedVideoId);
          if (videoRecord?.data) {
            objectUrl = URL.createObjectURL(videoRecord.data);
            setVideoUrl(objectUrl);
          } else {
            setVideoUrl(null);
          }
        } catch (error) {
          console.error('Lỗi tải video từ DB:', error);
          setVideoUrl(null);
        }
      } else {
        setVideoUrl(null);
      }
    };
    loadVideo();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [scene.generatedVideoId]);

  const [currentVideoMessage, setCurrentVideoMessage] = useState(VIDEO_LOADING_MESSAGES[0]);

  useEffect(() => {
    let interval: number;
    if (scene.isGeneratingVideo) {
      setCurrentVideoMessage(VIDEO_LOADING_MESSAGES[0]);
      interval = window.setInterval(() => {
        setCurrentVideoMessage(prev => {
          const currentIndex = VIDEO_LOADING_MESSAGES.indexOf(prev);
          return VIDEO_LOADING_MESSAGES[(currentIndex + 1) % VIDEO_LOADING_MESSAGES.length];
        });
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scene.isGeneratingVideo]);

  const isActionDisabled = scene.isGeneratingImage || scene.isGeneratingVideo;

  const apiKeyTitle = !isApiKeySet ? 'Vui lòng đặt khóa API của bạn trong cài đặt (⚙️)' : '';

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={`aspect-${scene.scene_number}`}
          className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Định dạng
        </label>
        <select
          id={`aspect-${scene.scene_number}`}
          value={aspectRatio}
          onChange={e => setAspectRatio(e.target.value as AspectRatio)}
          className="focus:border-primary focus:ring-primary block w-auto rounded-md border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700"
          disabled={isActionDisabled}>
          <option value="16:9">16:9 (Ngang)</option>
          <option value="9:16">9:16 (Dọc)</option>
          <option value="1:1">1:1 (Vuông)</option>
          <option value="4:3">4:3 (Cổ điển)</option>
          <option value="3:4">3:4 (Chân dung)</option>
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`scene-image-${scene.scene_number}`}
          className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Hình ảnh
        </label>
        <div className="group relative flex h-40 items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700/50">
          {scene.isGeneratingImage && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 p-2 text-center text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
              <span className="mt-2 text-xs">Đang tạo...</span>
              <button
                onClick={() => onCancelGenerateImage(actIndex, sceneIndex)}
                className="mt-3 rounded-md bg-red-500/80 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600/80">
                Hủy
              </button>
            </div>
          )}
          {imageUrl && !scene.isGeneratingImage ? (
            <>
              <img src={imageUrl} alt={`Ảnh cho cảnh ${scene.scene_number}`} className="h-full w-full object-cover" />
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteImage(actIndex, sceneIndex);
                }}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                title="Xóa ảnh">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </>
          ) : (
            !scene.isGeneratingImage && <span className="text-sm text-slate-400 dark:text-slate-500">Chưa có ảnh</span>
          )}
        </div>
        <button
          onClick={() => onOpenImageModal(actIndex, sceneIndex, aspectRatio)}
          disabled={isActionDisabled || !isApiKeySet}
          title={apiKeyTitle}
          className="focus:ring-primary inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Tạo ảnh
        </button>
      </div>

      <div className="space-y-2">
        <label
          htmlFor={`scene-video-${scene.scene_number}`}
          className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Video
        </label>
        <div className="group relative flex h-40 items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-700/50">
          {scene.isGeneratingVideo && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 p-2 text-center text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
              <span className="mt-2 text-xs">{currentVideoMessage}</span>
            </div>
          )}
          {videoUrl && !scene.isGeneratingVideo && (
            <>
              <video
                id={`scene-video-${scene.scene_number}`}
                src={videoUrl}
                controls
                className="h-full w-full object-cover">
                <track kind="captions" label="No captions" />
              </video>
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteVideo(actIndex, sceneIndex);
                }}
                className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-red-500 group-hover:opacity-100"
                title="Xóa video">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </>
          )}
          {!videoUrl && !scene.isGeneratingVideo && (
            <span className="text-sm text-slate-400 dark:text-slate-500">Chưa có video</span>
          )}
        </div>
        <button
          onClick={() => onGenerateVideo(actIndex, sceneIndex, aspectRatio)}
          disabled={isActionDisabled || !isApiKeySet}
          title={apiKeyTitle}
          className="focus:ring-primary inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Tạo video
        </button>
      </div>
    </div>
  );
};

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
      <div className="space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Tạo tài sản</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Cảnh {activeScene.scene_number} - {activeScene.location}
              </span>
            </p>
          </div>
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
        </header>

        <SceneAssetCard
          scene={activeScene!}
          actIndex={actIndex!}
          sceneIndex={sceneIndex!}
          onOpenImageModal={handleOpenImageModal}
          onCancelGenerateImage={(ai, si) => cancelGenerateSceneImage(activeScript!, ai, si)}
          onDeleteImage={(ai, si) => deleteSceneImage(activeScript!, ai, si)}
          onGenerateVideo={(ai, si, ar) => generateSceneVideo(activeScript!, ai, si, ar)}
          onDeleteVideo={(ai, si) => deleteSceneVideo(activeScript!, ai, si)}
          defaultAspectRatio={defaultAspectRatio}
          isApiKeySet={isApiKeySet}
        />
      </div>
    </>
  );
};

export default AssetDisplay;
