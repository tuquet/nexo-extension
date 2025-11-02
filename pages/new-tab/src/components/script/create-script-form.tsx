import ScriptSettingModal from '@src/components/common/app-setting-modal';
import CreationForm from '@src/components/script/creation-form';
import { generateScript } from '@src/services/background-api';
import { useApiKey } from '@src/stores/use-api-key';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateScriptForm = () => {
  const { apiKey } = useApiKey();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const addScript = useScriptsStore(s => s.addScript);
  const importDataFromString = useScriptsStore(s => s.importDataFromString);
  const importData = useScriptsStore(s => s.importData);
  const newScript = useScriptsStore(s => s.newScript);
  const isSettingsModalOpen = useScriptsStore(s => s.settingsModalOpen);
  const setSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);
  const navigate = useNavigate();
  const isCancelledRef = useRef(false);

  // Dọn dẹp trạng thái activeScript khi vào trang tạo mới
  useEffect(() => {
    newScript();
  }, [newScript]);

  const handleGenerateScript = async (
    prompt: string,
    language: 'en-US' | 'vi-VN',
    scriptModel: string,
    temperature: number,
    topP: number,
  ) => {
    setIsLoading(true);
    setError(null);
    isCancelledRef.current = false;

    try {
      if (!apiKey) throw new Error('API key is not set.');
      const generatedScript = await generateScript({
        prompt,
        language,
        apiKey,
        modelName: scriptModel,
        temperature,
        topP,
        topK: 40,
        maxOutputTokens: 8192,
      });

      if (isCancelledRef.current) return; // Dừng xử lý nếu người dùng đã hủy

      // After generating, add the script to the store. This will also set it as active.
      const newAddedScript = await addScript(generatedScript);
      if (newAddedScript?.id) {
        // Navigate to the main script view to see the result
        navigate(`/script/${newAddedScript.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.');
    } finally {
      // Luôn đặt lại trạng thái loading sau khi hoàn tất, bất kể thành công hay thất bại.
      // Điều này đảm bảo spinner được gỡ bỏ.
      setIsLoading(false);
    }
    // Don't set isLoading to false on success, as we are navigating away.
  };

  const handleImportJson = async (jsonString: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const lastImportedId = await importDataFromString(jsonString);
      console.log(lastImportedId, 'lastImportedId');
      if (lastImportedId) {
        navigate(`/script/${lastImportedId}`);
      } else {
        navigate('/script');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi nhập.');
      // Không cần setIsLoading(false) ở đây vì đã có trong finally
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    setError(null);
    try {
      const lastImportedId = await importData(event);
      if (lastImportedId) {
        // Điều hướng đến kịch bản cuối cùng vừa được import
        navigate(`/script/${lastImportedId}`);
      } else {
        navigate('/script'); // Nếu không có ID, quay về trang danh sách
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi nhập file.');
      // Không cần setIsLoading(false) ở đây vì đã có trong finally
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <CreationForm
            onGenerate={handleGenerateScript}
            onImportJson={handleImportJson}
            onImportFile={handleImportFile}
            isLoading={isLoading}
            onCancel={() => navigate(-1)}
          />
          {error && <div className="error mt-4 text-red-500">{error}</div>}
        </div>
      </main>
      <ScriptSettingModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </>
  );
};

export default CreateScriptForm;
