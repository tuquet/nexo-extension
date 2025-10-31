import ScriptSettingModal from '@src/components/common/app-setting-modal';
import CreationForm from '@src/components/script/creation-form';
import ScriptLoader from '@src/components/script/script-loader';
import {
  SCRIPT_GENERATION_MODEL,
  IMAGE_GENERATION_MODEL,
  VIDEO_GENERATION_MODEL,
  DEFAULT_ASPECT_RATIO,
} from '@src/constants';
import { generateScript } from '@src/services/gemini-service';
import { useApiKey } from '@src/stores/use-api-key';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AspectRatio } from '@src/types';

const CreateScriptForm = () => {
  const { apiKey } = useApiKey();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const addScript = useScriptsStore(s => s.addScript);
  const newScript = useScriptsStore(s => s.newScript);
  const isSettingsModalOpen = useScriptsStore(s => s.settingsModalOpen);
  const setSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);
  const navigate = useNavigate();
  const isCancelledRef = useRef(false);

  const handleGenerateScript = async (
    prompt: string,
    language: 'en-US' | 'vi-VN',
    aspectRatio: AspectRatio,
    scriptModel: string,
    imageModel: string,
    videoModel: string,
  ) => {
    setIsLoading(true);
    setError(null);
    isCancelledRef.current = false;
    newScript(); // Reset active script state before generation

    try {
      if (!apiKey) throw new Error('API key is not set.');
      const generatedScript = await generateScript(prompt, language, apiKey, scriptModel || SCRIPT_GENERATION_MODEL);

      if (isCancelledRef.current) return; // Dừng xử lý nếu người dùng đã hủy

      generatedScript.setting.defaultAspectRatio = aspectRatio || DEFAULT_ASPECT_RATIO;
      generatedScript.setting.defaultImageModel = imageModel || IMAGE_GENERATION_MODEL;
      generatedScript.setting.defaultVideoModel = videoModel || VIDEO_GENERATION_MODEL;

      // After generating, add the script to the store. This will also set it as active.
      const newScript = await addScript(generatedScript);
      // Navigate to the main script view to see the result
      navigate(`/script?id=${newScript.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
      setIsLoading(false); // Stop loading on error to show the form again
    }
    // Don't set isLoading to false on success, as we are navigating away.
  };

  const handleCancelGeneration = () => {
    isCancelledRef.current = true;
    setIsLoading(false);
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <ScriptLoader onCancel={handleCancelGeneration} />
            </div>
          ) : (
            <CreationForm onGenerate={handleGenerateScript} isLoading={isLoading} onCancel={() => navigate(-1)} />
          )}
          {error && <div className="error mt-4 text-red-500">{error}</div>}
        </div>
      </main>
      <ScriptSettingModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </>
  );
};

export default CreateScriptForm;
