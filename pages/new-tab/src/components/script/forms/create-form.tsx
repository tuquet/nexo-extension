import { toast } from '@extension/ui';
import ScriptSettingModal from '@src/components/common/app-setting-modal';
import { GenerationForm } from '@src/components/script/generation/generation-form';
import { useScriptGeneration } from '@src/hooks/use-script-generation';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { useUIStateStore } from '@src/stores/use-ui-state-store';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateForm = () => {
  const importDataFromString = useScriptsStore(s => s.importDataFromString);
  const importData = useScriptsStore(s => s.importData);
  const newScript = useScriptsStore(s => s.newScript);
  const isSettingsModalOpen = useUIStateStore(s => s.settingsModalOpen);
  const setSettingsModalOpen = useUIStateStore(s => s.setSettingsModalOpen);
  const navigate = useNavigate();

  // Use custom hook for script generation logic
  const { generateFromAPI, generateWithAutomate, isLoading, error } = useScriptGeneration();

  useEffect(() => {
    newScript();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [newScript]);

  const handleImportJson = async (jsonString: string) => {
    try {
      const lastImportedId = await importDataFromString(jsonString);

      if (lastImportedId) {
        toast.success('Đã nhập kịch bản thành công!');
        navigate(`/script/${lastImportedId}`);
      } else {
        navigate('/script');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định khi nhập.';
      toast.error(errorMessage);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const lastImportedId = await importData(event);

      if (lastImportedId) {
        toast.success('Đã nhập file thành công!');
        navigate(`/script/${lastImportedId}`);
      } else {
        navigate('/script');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi nhập file.';
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <GenerationForm
            onGenerate={generateFromAPI}
            onGenerateWithAutomate={generateWithAutomate}
            onImportJson={handleImportJson}
            onImportFile={handleImportFile}
            isLoading={isLoading}
          />
          {error && <div className="error mt-4 text-red-500">{error}</div>}
        </div>
      </main>
      <ScriptSettingModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </>
  );
};

export default CreateForm;
