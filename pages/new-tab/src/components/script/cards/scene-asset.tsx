import { AssetPickerModal } from '../modals/asset-picker-modal';
import { VIDEO_LOADING_MESSAGES, DEFAULT_ASPECT_RATIO } from '@extension/shared';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@extension/ui';
import { db } from '@src/db';
import { useSceneAssets } from '@src/hooks/use-scene-assets';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { ImagePlus, UploadCloud, Video as VideoIcon, FolderOpen } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Scene, AspectRatio } from '@src/types';
import type React from 'react';

const SceneAsset: React.FC<{
  scriptId: number | undefined;
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
  scriptId,
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
  const uploadImageInputRef = useRef<HTMLInputElement>(null);
  const uploadVideoInputRef = useRef<HTMLInputElement>(null);
  const updateSceneGeneratedAssetId = useScriptsStore(s => s.updateSceneGeneratedAssetId);

  // State for asset picker modals
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [isVideoPickerOpen, setIsVideoPickerOpen] = useState(false);

  // Generate unique scene ID for ScriptAssetMapping
  const sceneId = `act${actIndex}-scene${sceneIndex}`;

  // Use new hook to fetch assets via ScriptAssetMapping (schema v7)
  const { imageUrl, videoUrl, imageId, videoId, linkAsset, replaceAsset } = useSceneAssets({
    scriptId: scriptId!,
    sceneId,
    // Legacy fallback for old schema
    legacyImageId: scene.generatedImageId,
    legacyVideoId: scene.generatedVideoId,
  });

  const [currentVideoMessage, setCurrentVideoMessage] = useState<string>(VIDEO_LOADING_MESSAGES[0]);

  useEffect(() => {
    let interval: number;
    if (scene.isGeneratingVideo) {
      setCurrentVideoMessage(VIDEO_LOADING_MESSAGES[0]);
      interval = window.setInterval(() => {
        setCurrentVideoMessage(prev => {
          const messages = VIDEO_LOADING_MESSAGES as readonly string[];
          const currentIndex = messages.indexOf(prev);
          return messages[(currentIndex + 1) % messages.length] || messages[0];
        });
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scene.isGeneratingVideo]);

  const isActionDisabled = scene.isGeneratingImage || scene.isGeneratingVideo;

  const apiKeyTitle = !isApiKeySet ? 'Vui lòng đặt khóa API của bạn trong cài đặt (⚙️)' : '';

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !scriptId) return;

    try {
      // Schema v7: Save asset without scriptId, then create mapping
      const newImageId = await db.images.add({
        data: file,
        uploadSource: 'manual-upload',
        originalFilename: file.name,
        uploadedAt: new Date(),
        mimeType: file.type,
      });

      // Link asset to scene via mapping
      await linkAsset('image', newImageId);

      // Legacy: Also update scene.generatedImageId for backward compatibility
      await updateSceneGeneratedAssetId(actIndex, sceneIndex, 'image', newImageId);
    } catch (error) {
      console.error('Lỗi tải ảnh lên:', error);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !scriptId) return;

    try {
      // Schema v7: Save asset without scriptId, then create mapping
      const newVideoId = await db.videos.add({
        data: file,
        uploadSource: 'manual-upload',
        originalFilename: file.name,
        uploadedAt: new Date(),
        mimeType: file.type,
      });

      // Link asset to scene via mapping
      await linkAsset('video', newVideoId);

      // Legacy: Also update scene.generatedVideoId for backward compatibility
      await updateSceneGeneratedAssetId(actIndex, sceneIndex, 'video', newVideoId);
    } catch (error) {
      console.error('Lỗi tải video lên:', error);
    }
  };

  // Handler for selecting asset from gallery
  const handleSelectFromGallery = async (assetType: 'image' | 'video', selectedAssetId: number) => {
    try {
      const currentId = assetType === 'image' ? imageId : videoId;

      if (currentId) {
        // Replace existing asset
        await replaceAsset(assetType, currentId, selectedAssetId);
      } else {
        // Link new asset
        await linkAsset(assetType, selectedAssetId);
      }

      // Legacy: Also update scene for backward compatibility
      await updateSceneGeneratedAssetId(actIndex, sceneIndex, assetType, selectedAssetId);
    } catch (error) {
      console.error(`Lỗi chọn ${assetType} từ gallery:`, error);
    }
  };
  return (
    <Card className="border-0 p-0">
      <CardHeader className="p-0">
        <label
          htmlFor={`aspect-${scene.scene_number}`}
          className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Định dạng
        </label>
        <Select value={aspectRatio} onValueChange={v => setAspectRatio(v as AspectRatio)} disabled={isActionDisabled}>
          <SelectTrigger id={`aspect-${scene.scene_number}`} className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Ngang)</SelectItem>
            <SelectItem value="9:16">9:16 (Dọc)</SelectItem>
            <SelectItem value="1:1">1:1 (Vuông)</SelectItem>
            <SelectItem value="4:3">4:3 (Cổ điển)</SelectItem>
            <SelectItem value="3:4">3:4 (Chân dung)</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-6 p-0">
        <div className="space-y-1">
          <label
            htmlFor={`scene-image-${scene.scene_number}`}
            className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Hình ảnh
          </label>
          <div className="group relative flex h-40 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700/50">
            {scene.isGeneratingImage && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 p-2 text-center text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
                <span className="mt-2">Đang tạo...</span>
                <button
                  onClick={() => onCancelGenerateImage(actIndex, sceneIndex)}
                  className="mt-3 rounded-md bg-red-500/80 px-3 py-1 font-semibold text-white transition-colors hover:bg-red-600/80">
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
              !scene.isGeneratingImage && (
                <span className="text-sm text-slate-400 dark:text-slate-500">Chưa có ảnh</span>
              )
            )}
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => uploadImageInputRef.current?.click()}
                disabled={isActionDisabled}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Tải lên
              </Button>
              <input
                type="file"
                ref={uploadImageInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button
                className="flex-1"
                onClick={() => onOpenImageModal(actIndex, sceneIndex, aspectRatio)}
                title={apiKeyTitle}>
                <ImagePlus className="mr-2 h-4 w-4" />
                Tạo AI
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setIsImagePickerOpen(true)}
              disabled={isActionDisabled}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Chọn từ thư viện
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor={`scene-video-${scene.scene_number}`}
            className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Video
          </label>
          <div className="group relative flex h-40 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700/50">
            {scene.isGeneratingVideo && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 p-2 text-center text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
                <span className="mt-2">{currentVideoMessage}</span>
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
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => uploadVideoInputRef.current?.click()}
                disabled={isActionDisabled}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Tải lên
              </Button>
              <input
                type="file"
                ref={uploadVideoInputRef}
                className="hidden"
                accept="video/*"
                onChange={handleVideoUpload}
              />
              <Button
                className="flex-1"
                onClick={() => onGenerateVideo(actIndex, sceneIndex, aspectRatio)}
                title={apiKeyTitle}>
                <VideoIcon className="mr-2 h-4 w-4" />
                Tạo AI
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setIsVideoPickerOpen(true)}
              disabled={isActionDisabled}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Chọn từ thư viện
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Asset Picker Modals */}
      <AssetPickerModal
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={assetId => handleSelectFromGallery('image', assetId)}
        assetType="image"
        currentAssetId={imageId ?? undefined}
      />
      <AssetPickerModal
        isOpen={isVideoPickerOpen}
        onClose={() => setIsVideoPickerOpen(false)}
        onSelect={assetId => handleSelectFromGallery('video', assetId)}
        assetType="video"
        currentAssetId={videoId ?? undefined}
      />
    </Card>
  );
};

export default SceneAsset;
