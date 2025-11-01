import { db } from '../db';
import {
  generateSceneImage as geminiGenerateSceneImage,
  generateSceneVideo as geminiGenerateSceneVideo,
  blobToBase64,
} from '../services/gemini-service';
import { useApiKey } from '../stores/use-api-key';
import type { ScriptStory, AspectRatio } from '../types';

const base64ToBlob = async (base64: string) => (await fetch(base64)).blob();

const ASSET_EVENTS = { CHANGED: 'assets-changed' } as const;

const clone = <T>(v: T): T =>
  typeof structuredClone === 'function'
    ? // use native structuredClone when available for accurate cloning
      structuredClone(v)
    : JSON.parse(JSON.stringify(v));

type Callbacks = {
  setActiveScript: (script: ScriptStory) => void;
  saveActiveScript: (script: ScriptStory) => Promise<void>;
  setError: (error: string | null) => void;
};

export const useAssets = (
  setActiveScript: (script: ScriptStory) => void,
  saveActiveScript: (script: ScriptStory) => Promise<void>,
  setError: (error: string | null) => void,
) => {
  const cb: Callbacks = { setActiveScript, saveActiveScript, setError };
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
    cb.setActiveScript(working); // Cập nhật UI ngay lập tức để vô hiệu hóa nút

    try {
      const imgUrl = await geminiGenerateSceneImage(prompt, aspectRatio, apiKey, modelName, negativePrompt);
      const imgBlob = await base64ToBlob(imgUrl);
      const imageId = await db.images.add({ data: imgBlob, scriptId });
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));

      const updated = clone(working);
      const scene = updated.acts[actIndex].scenes[sceneIndex];
      scene.generatedImageId = imageId;
      scene.isGeneratingImage = false;
      await cb.saveActiveScript(updated); // Chỉ dùng saveActiveScript để cập nhật trạng thái cuối cùng
    } catch (e) {
      console.error('Lỗi tạo ảnh:', e);
      const reverted = clone(script);
      reverted.acts[actIndex].scenes[sceneIndex].isGeneratingImage = false;
      await cb.saveActiveScript(reverted); // Dùng saveActiveScript để đảm bảo tính nhất quán
      cb.setError(e instanceof Error ? e.message : 'Không thể tạo ảnh.');
    }
  };

  const cancelGenerateSceneImage = (script: ScriptStory, actIndex: number, sceneIndex: number) => {
    const updated = clone(script);
    const scene = updated.acts?.[actIndex]?.scenes?.[sceneIndex];
    if (scene) scene.isGeneratingImage = false;
    cb.setActiveScript(updated);
  };

  const generateSceneVideo = async (
    script: ScriptStory,
    actIndex: number,
    sceneIndex: number,
    modelName: string,
    aspectRatio: AspectRatio,
  ) => {
    const apiKey = getApiKey();
    if (!script?.id || !apiKey) return;
    const scriptId = script.id;

    const working = clone(script);
    working.acts[actIndex].scenes[sceneIndex].isGeneratingVideo = true;
    cb.setActiveScript(working); // Cập nhật UI ngay lập tức để vô hiệu hóa nút

    const scene = script.acts[actIndex].scenes[sceneIndex];
    const prompt = `Cinematic shot for a movie scene. Location: ${scene.location} (${scene.time}). Action: ${scene.action}. Visual style: ${scene.visual_style}. Audio style: ${scene.audio_style}.`;

    try {
      let startImage;
      if (scene.generatedImageId) {
        const img = await db.images.get(scene.generatedImageId);
        if (img?.data) startImage = { mimeType: img.data.type, data: await blobToBase64(img.data) };
      }

      const videoBlob = await geminiGenerateSceneVideo(prompt, aspectRatio, apiKey, modelName, startImage);
      const videoId = await db.videos.add({ data: videoBlob, scriptId });
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));

      const updated = clone(working);
      const s = updated.acts[actIndex].scenes[sceneIndex];
      s.generatedVideoId = videoId;
      s.isGeneratingVideo = false;
      await cb.saveActiveScript(updated); // Chỉ dùng saveActiveScript để cập nhật trạng thái cuối cùng
    } catch (e) {
      console.error('Lỗi tạo video:', e);
      const reverted = clone(script);
      reverted.acts[actIndex].scenes[sceneIndex].isGeneratingVideo = false;
      await cb.saveActiveScript(reverted); // Dùng saveActiveScript để đảm bảo tính nhất quán
      cb.setError(`Tạo video thất bại: ${e instanceof Error ? e.message : 'Không rõ nguyên nhân'}`);
    }
  };

  const deleteSceneImage = async (script: ScriptStory, actIndex: number, sceneIndex: number) => {
    const updated = clone(script);
    const scene = updated.acts[actIndex].scenes[sceneIndex];
    if (!scene.generatedImageId) return;

    try {
      await db.images.delete(scene.generatedImageId);
      delete scene.generatedImageId;
      await cb.saveActiveScript(updated);
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));
    } catch (e) {
      console.error('Lỗi xóa ảnh:', e);
      cb.setError('Không thể xóa ảnh.');
    }
  };

  const deleteSceneVideo = async (script: ScriptStory, actIndex: number, sceneIndex: number) => {
    const updated = clone(script);
    const scene = updated.acts[actIndex].scenes[sceneIndex];
    if (!scene.generatedVideoId) return;

    try {
      await db.videos.delete(scene.generatedVideoId);
      delete scene.generatedVideoId;
      await cb.saveActiveScript(updated);
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));
    } catch (e) {
      console.error('Lỗi xóa video:', e);
      cb.setError('Không thể xóa video.');
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
        }
      }

      if (changed) await cb.saveActiveScript(script);
      window.dispatchEvent(new CustomEvent(ASSET_EVENTS.CHANGED));
    } catch (e) {
      console.error(`Lỗi xóa ${type}:`, e);
      cb.setError('Không thể xóa tài sản.');
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
