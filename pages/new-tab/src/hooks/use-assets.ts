import { db } from '../db';
import {
  generateSceneImage as backgroundGenerateSceneImage,
  generateSceneVideo as backgroundGenerateSceneVideo,
} from '../services/background-api';
import { useApiKey } from '../stores/use-api-key';
import { useScriptsStore } from '../stores/use-scripts-store';
import type { ScriptStory, AspectRatio } from '../types';

/**
 * Chuyển đổi một chuỗi data URL (ví dụ: "data:image/jpeg;base64,...") thành một Blob.
 * @param dataUrl Chuỗi data URL.
 * @returns Một đối tượng Blob.
 */
const dataUrlToBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(',');
  const mimeType = parts[0].match(/:(.*?);/)?.[1];
  const b64 = atob(parts[1]);
  let n = b64.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = b64.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mimeType });
};

const ASSET_EVENTS = { CHANGED: 'assets-changed' } as const;

const clone = <T>(v: T): T =>
  typeof structuredClone === 'function'
    ? // use native structuredClone when available for accurate cloning
      structuredClone(v)
    : JSON.parse(JSON.stringify(v));

/**
 * Convert Blob to base64 string
 * Exported for potential future use with video startImage feature
 */
export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export const useAssets = (setError: (error: string | null) => void) => {
  const getApiKey = () => useApiKey.getState().apiKey;

  const generateSceneImage = async (
    script: ScriptStory,
    actIndex: number,
    sceneIndex: number,
    prompt: string,
    negativePrompt: string,
    modelName: string,
    aspectRatio: AspectRatio,
  ) => {
    const apiKey = getApiKey();
    if (!script?.id || !apiKey) return;
    const scriptId = script.id;

    const working = clone(script);
    working.acts[actIndex].scenes[sceneIndex].isGeneratingImage = true;
    // Cập nhật UI ngay lập tức để vô hiệu hóa nút
    useScriptsStore.getState().setActiveScript(working);

    try {
      const { imageUrl } = await backgroundGenerateSceneImage({
        prompt,
        negativePrompt,
        aspectRatio,
        apiKey,
        modelName,
      });
      const imgBlob = dataUrlToBlob(imageUrl);
      const imageId = await db.images.add({ data: imgBlob, scriptId });
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));

      const updated = clone(working);
      const scene = updated.acts[actIndex].scenes[sceneIndex];
      scene.generatedImageId = imageId;
      scene.isGeneratingImage = false;
      await useScriptsStore.getState().saveActiveScript(updated); // Chỉ dùng saveActiveScript để cập nhật trạng thái cuối cùng
    } catch (e) {
      console.error('Lỗi tạo ảnh:', e);
      const reverted = clone(script);
      reverted.acts[actIndex].scenes[sceneIndex].isGeneratingImage = false;
      await useScriptsStore.getState().saveActiveScript(reverted); // Dùng saveActiveScript để đảm bảo tính nhất quán
      setError(e instanceof Error ? e.message : 'Không thể tạo ảnh.');
    }
  };

  const cancelGenerateSceneImage = (script: ScriptStory, actIndex: number, sceneIndex: number) => {
    const updated = clone(script);
    const scene = updated.acts?.[actIndex]?.scenes?.[sceneIndex];
    if (scene) scene.isGeneratingImage = false;
    useScriptsStore.getState().setActiveScript(updated);
  };

  const generateSceneVideo = async (
    script: ScriptStory,
    actIndex: number,
    sceneIndex: number,
    modelName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _aspectRatio: AspectRatio, // TODO: Use aspectRatio when video API supports it
  ) => {
    const apiKey = getApiKey();
    if (!script?.id || !apiKey) return;
    const scriptId = script.id;

    const working = clone(script);
    working.acts[actIndex].scenes[sceneIndex].isGeneratingVideo = true;
    // Cập nhật UI ngay lập tức để vô hiệu hóa nút
    useScriptsStore.getState().setActiveScript(working);

    const scene = script.acts[actIndex].scenes[sceneIndex];
    const prompt = `Cinematic shot for a movie scene. Location: ${scene.location} (${scene.time}). Action: ${scene.action}. Visual style: ${scene.visual_style}. Audio style: ${scene.audio_style}.`;

    try {
      // TODO: Support startImage when video API is implemented
      // let startImage;
      // if (scene.generatedImageId) {
      //   const img = await db.images.get(scene.generatedImageId);
      //   if (img?.data) startImage = { mimeType: img.data.type, data: await blobToBase64(img.data) };
      // }

      const { videoUrl } = await backgroundGenerateSceneVideo({
        prompt,
        apiKey,
        modelName,
      });
      // Convert base64 data URL to Blob
      const videoBlob = dataUrlToBlob(videoUrl);
      const videoId = await db.videos.add({ data: videoBlob, scriptId });
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));

      const updated = clone(working);
      const s = updated.acts[actIndex].scenes[sceneIndex];
      s.generatedVideoId = videoId;
      s.isGeneratingVideo = false;
      await useScriptsStore.getState().saveActiveScript(updated); // Chỉ dùng saveActiveScript để cập nhật trạng thái cuối cùng
    } catch (e) {
      console.error('Lỗi tạo video:', e);
      const reverted = clone(script);
      reverted.acts[actIndex].scenes[sceneIndex].isGeneratingVideo = false;
      await useScriptsStore.getState().saveActiveScript(reverted); // Dùng saveActiveScript để đảm bảo tính nhất quán
      setError(`Tạo video thất bại: ${e instanceof Error ? e.message : 'Không rõ nguyên nhân'}`);
    }
  };

  const deleteSceneImage = async (script: ScriptStory, actIndex: number, sceneIndex: number) => {
    const updated = clone(script);
    const scene = updated.acts[actIndex].scenes[sceneIndex];
    if (!scene.generatedImageId) return;

    try {
      await db.images.delete(scene.generatedImageId);
      delete scene.generatedImageId;
      await useScriptsStore.getState().saveActiveScript(updated);
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));
    } catch (e) {
      console.error('Lỗi xóa ảnh:', e);
      setError('Không thể xóa ảnh.');
    }
  };

  const deleteSceneVideo = async (script: ScriptStory, actIndex: number, sceneIndex: number) => {
    const updated = clone(script);
    const scene = updated.acts[actIndex].scenes[sceneIndex];
    if (!scene.generatedVideoId) return;

    try {
      await db.videos.delete(scene.generatedVideoId);
      delete scene.generatedVideoId;
      await useScriptsStore.getState().saveActiveScript(updated);
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));
    } catch (e) {
      console.error('Lỗi xóa video:', e);
      setError('Không thể xóa video.');
    }
  };

  const deleteAssetFromGallery = async (type: 'image' | 'video' | 'audio', assetId: number, scriptId: number) => {
    try {
      await (type === 'image'
        ? db.images.delete(assetId)
        : type === 'video'
          ? db.videos.delete(assetId)
          : db.audios.delete(assetId));
      const script = await db.scripts.get(scriptId);
      if (!script) return;

      let changed = false;
      for (const act of script.acts) {
        for (const scene of act.scenes) {
          if (type === 'image' && scene.generatedImageId === assetId) {
            delete scene.generatedImageId;
            changed = true;
          }
          if (type === 'video' && scene.generatedVideoId === assetId) {
            delete scene.generatedVideoId;
            changed = true;
          }
          if (type === 'audio') {
            // Xóa audio của từng câu thoại
            for (const dialogue of scene.dialogues) {
              if (dialogue.generatedAudioId === assetId) {
                delete dialogue.generatedAudioId;
                changed = true;
              }
            }
          }
        }
      }

      // Xóa audio gộp của toàn bộ kịch bản
      if (type === 'audio' && script.buildMeta?.fullScriptAudioId === assetId) {
        delete script.buildMeta.fullScriptAudioId;
        changed = true;
      }

      if (changed) await useScriptsStore.getState().saveActiveScript(script);
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));
    } catch (e) {
      console.error(`Lỗi xóa ${type}:`, e);
      setError('Không thể xóa tài sản.');
    }
  };

  return {
    generateSceneImage,
    cancelGenerateSceneImage,
    generateSceneVideo,
    deleteSceneImage,
    deleteSceneVideo,
    deleteAssetFromGallery,
  };
};

export { ASSET_EVENTS };
