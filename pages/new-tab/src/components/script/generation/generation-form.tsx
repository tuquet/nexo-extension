import { Button, Tabs, TabsContent, TabsList, TabsTrigger, toast } from '@extension/ui';
import { TemplateSelector } from '@src/components/script/forms/template-selector';
import { AIGenerationTab } from '@src/components/script/generation/ai-generation-tab';
import { JsonImportTab } from '@src/components/script/generation/json-import-tab';
import { SCRIPT_GENERATION_LOADING_MESSAGES } from '@src/constants';
import { useApiKey } from '@src/stores/use-api-key';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PromptRecord } from '@extension/database';

interface GenerationFormProps {
  onGenerate: (data: {
    prompt: string;
    language: 'en-US' | 'vi-VN';
    scriptModel: string;
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
    systemInstruction?: string;
  }) => void;
  onGenerateWithAutomate: (data: {
    prompt: string;
    language: 'en-US' | 'vi-VN';
    scriptModel: string;
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
    systemInstruction?: string;
  }) => void;
  onImportJson: (jsonString: string) => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
}

export const GenerationForm: React.FC<GenerationFormProps> = ({
  onGenerate,
  onGenerateWithAutomate,
  onImportJson,
  onImportFile,
  isLoading,
}) => {
  const { isApiKeySet } = useApiKey();
  const setSettingsModalOpen = useScriptsStore(s => s.setSettingsModalOpen);
  const [activeTab, setActiveTab] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptRecord | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(SCRIPT_GENERATION_LOADING_MESSAGES[0]);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = SCRIPT_GENERATION_LOADING_MESSAGES.indexOf(prev);
          const nextIndex = (currentIndex + 1) % SCRIPT_GENERATION_LOADING_MESSAGES.length;
          return SCRIPT_GENERATION_LOADING_MESSAGES[nextIndex];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSelectTemplate = (prompt: PromptRecord) => {
    setSelectedTemplate(prompt);
    setActiveTab('ai');
    toast.success(`Đã tải template "${prompt.title}"`);
  };

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tạo kịch bản mới</h2>
      <p className="mb-8 text-slate-500 dark:text-slate-400">Bắt đầu bằng cách điền vào các chi tiết bên dưới.</p>

      {!isApiKeySet && (
        <div className="mb-6 flex items-start gap-3 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p>Bạn cần thiết lập khóa API Gemini để có thể tạo kịch bản và sử dụng các tính năng AI.</p>
            <Button
              variant="link"
              className="h-auto p-0 text-yellow-800 dark:text-yellow-200"
              onClick={() => setSettingsModalOpen(true)}>
              Mở cài đặt và thêm khóa API
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-md bg-slate-100 p-1 dark:bg-slate-800">
          <TabsTrigger value="template">Từ Template</TabsTrigger>
          <TabsTrigger value="ai">Tạo bằng AI</TabsTrigger>
          <TabsTrigger value="json">Nhập từ JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="mt-6">
          <TemplateSelector onSelectTemplate={handleSelectTemplate} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <AIGenerationTab
            isLoading={isLoading}
            selectedTemplate={selectedTemplate}
            onSubmit={onGenerate}
            onSubmitWithAutomate={onGenerateWithAutomate}
          />
        </TabsContent>

        <TabsContent value="json" className="mt-6">
          <JsonImportTab isLoading={isLoading} onImportJson={onImportJson} onImportFile={onImportFile} />
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300"></div>
            <h4 className="mt-6 text-lg font-semibold text-slate-800 dark:text-slate-200">
              Đang tạo kịch bản của bạn...
            </h4>
            <p className="text-slate-500 dark:text-slate-400">{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
