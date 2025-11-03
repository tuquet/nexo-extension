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
import { VIDEO_LOADING_MESSAGES, DEFAULT_ASPECT_RATIO } from '@src/constants';
import { db } from '@src/db';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { ImagePlus, UploadCloud, Video as VideoIcon } from 'lucide-react';
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const uploadImageInputRef = useRef<HTMLInputElement>(null);
  const uploadVideoInputRef = useRef<HTMLInputElement>(null);
  const updateSceneGeneratedAssetId = useScriptsStore(s => s.updateSceneGeneratedAssetId);

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
    void loadImage();
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
    void loadVideo();
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !scriptId) return;

    try {
      // Lưu blob vào DB và lấy ID
      const imageId = await db.images.add({ data: file, scriptId: scriptId });
      // Cập nhật lại scene với imageId mới
      await updateSceneGeneratedAssetId(actIndex, sceneIndex, 'image', imageId);
    } catch (error) {
      console.error('Lỗi tải ảnh lên:', error);
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !scriptId) return;

    try {
      // Lưu blob vào DB và lấy ID
      const videoId = await db.videos.add({ data: file, scriptId: scriptId });
      // Cập nhật lại scene với videoId mới
      await updateSceneGeneratedAssetId(actIndex, sceneIndex, 'video', videoId);
    } catch (error) {
      console.error('Lỗi tải video lên:', error);
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
              !scene.isGeneratingImage && (
                <span className="text-sm text-slate-400 dark:text-slate-500">Chưa có ảnh</span>
              )
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => uploadImageInputRef.current?.click()}
              disabled={isActionDisabled}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Tải ảnh lên
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
              Tạo ảnh AI
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
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => uploadVideoInputRef.current?.click()}
              disabled={isActionDisabled}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Tải video lên
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
              Tạo video AI
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SceneAsset;
