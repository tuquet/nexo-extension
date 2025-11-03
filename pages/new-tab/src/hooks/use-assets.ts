import { db } from '../db';
import { assetGenerationService, ASSET_EVENTS } from '../services/asset-generation-service';
import { imageRepository, videoRepository } from '../services/repositories';
import { useApiKey } from '../stores/use-api-key';
import { useScriptsStore } from '../stores/use-scripts-store';
import type { AspectRatio, ScriptStory } from '../types';

const clone = <T>(v: T): T =>
  typeof structuredClone === 'function'
    ? // use native structuredClone when available for accurate cloning
      structuredClone(v)
    : JSON.parse(JSON.stringify(v));

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

    const working = clone(script);
    working.acts[actIndex].scenes[sceneIndex].isGeneratingImage = true;
    // Cập nhật UI ngay lập tức để vô hiệu hóa nút
    useScriptsStore.getState().setActiveScript(working);

    try {
      const imageId = await assetGenerationService.generateImage({
        prompt,
        negativePrompt,
        aspectRatio,
        apiKey,
        modelName,
        scriptId: script.id,
      });

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
    aspectRatio: AspectRatio,
  ) => {
    const apiKey = getApiKey();
    if (!script?.id || !apiKey) return;

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
      //   const img = await imageRepository.get(scene.generatedImageId);
      //   if (img?.data) startImage = { mimeType: img.data.type, data: await blobToBase64(img.data) };
      // }

      const videoId = await assetGenerationService.generateVideo({
        prompt,
        aspectRatio,
        apiKey,
        modelName,
        scriptId: script.id,
      });

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
      await imageRepository.delete(scene.generatedImageId);
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
      await videoRepository.delete(scene.generatedVideoId);
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
        ? imageRepository.delete(assetId)
        : type === 'video'
          ? videoRepository.delete(assetId)
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

// Re-export ASSET_EVENTS for backward compatibility
export { ASSET_EVENTS };
