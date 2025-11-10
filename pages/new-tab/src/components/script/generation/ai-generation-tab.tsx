import { FORM_STORAGE_KEYS } from '@extension/shared/lib/constants/ui-options';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  toast,
} from '@extension/ui';
import { VariableInputs } from '@src/components/script/generation/variable-inputs';
import usePersistentState from '@src/hooks/use-persistent-state';
import { useApiKey } from '@src/stores/use-api-key';
import {
  buildGenerationFormData,
  buildPromptFromTemplate,
  formatFullPromptForClipboard,
  validateRequiredVariables,
} from '@src/utils/prompt-builder';
import { AlertCircle, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PromptRecord } from '@extension/database';
import type { AIPlatform, GenerationFormData } from '@src/types/script-generation';

interface AIGenerationTabProps {
  isLoading: boolean;
  selectedTemplate?: PromptRecord | null;
  onSubmit: (data: GenerationFormData) => void;
  onSubmitWithAutomate: (data: GenerationFormData) => void;
}

export const AIGenerationTab: React.FC<AIGenerationTabProps> = ({
  isLoading,
  selectedTemplate,
  onSubmit,
  onSubmitWithAutomate,
}) => {
  const { isApiKeySet } = useApiKey();
  const [language] = usePersistentState<'en-US' | 'vi-VN'>(FORM_STORAGE_KEYS.LANGUAGE, 'vi-VN');
  const [platform, setPlatform] = usePersistentState<AIPlatform>(FORM_STORAGE_KEYS.PLATFORM, 'aistudio');
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [rawPrompt] = usePersistentState<string>(FORM_STORAGE_KEYS.RAW_PROMPT, '');
  const [overriddenTemplate, setOverriddenTemplate] = useState<Partial<PromptRecord> | null>(null);

  // Load any template overrides from localStorage on mount/template change
  useEffect(() => {
    if (!selectedTemplate?.id) return;
    const stored = localStorage.getItem(`template-override-${selectedTemplate.id}`);
    if (stored) {
      try {
        const override: Partial<PromptRecord> = JSON.parse(stored);
        setOverriddenTemplate(override);
      } catch {
        setOverriddenTemplate(null);
      }
    } else {
      setOverriddenTemplate(null);
    }
  }, [selectedTemplate?.id]);

  // Merge overridden template with original template
  const activeTemplate: PromptRecord = useMemo(() => {
    if (!selectedTemplate) return {} as PromptRecord;
    if (!overriddenTemplate) return selectedTemplate;

    return {
      ...selectedTemplate,
      ...overriddenTemplate,
      preprocessing: {
        ...selectedTemplate.preprocessing,
        ...overriddenTemplate.preprocessing,
      },
      modelSettings: {
        ...selectedTemplate.modelSettings,
        ...overriddenTemplate.modelSettings,
      },
    };
  }, [selectedTemplate, overriddenTemplate]);

  // Use active template's variable definitions
  const activeVariableDefinitions = activeTemplate.preprocessing?.variableDefinitions;

  // Memoize computed prompt to avoid re-computation on every render (Fix #1 & #4)
  const finalPrompt = useMemo(() => {
    if (!selectedTemplate) return '';
    return rawPrompt || buildPromptFromTemplate(selectedTemplate, variableValues);
  }, [selectedTemplate, rawPrompt, variableValues]);

  const handleCopyPrompt = useCallback(() => {
    if (!selectedTemplate) return;

    const fullPromptText = formatFullPromptForClipboard(
      finalPrompt,
      selectedTemplate.systemInstruction,
      variableValues, // Pass variables to replace in system instruction too
    );
    void navigator.clipboard.writeText(fullPromptText);
    toast.success('Đã copy full prompt (system + user) vào clipboard');
  }, [selectedTemplate, finalPrompt, variableValues]);

  const handleSubmitWithAPI = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTemplate) return;

      // Validate required variables using active definitions (may be overridden)
      if (selectedTemplate.preprocessing?.enableVariables) {
        const missingVars = validateRequiredVariables(
          selectedTemplate.prompt,
          variableValues,
          activeVariableDefinitions,
        );
        if (missingVars.length > 0) {
          toast.error('Missing required variables', {
            description: `Please fill: ${missingVars.join(', ')}`,
          });
          return;
        }
      }

      const formData: GenerationFormData = {
        ...buildGenerationFormData(selectedTemplate, variableValues, language),
        prompt: finalPrompt,
      };
      onSubmit(formData);
    },
    [selectedTemplate, variableValues, language, finalPrompt, activeVariableDefinitions, onSubmit],
  );

  const handleSubmitWithAutomation = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTemplate) return;

      // Validate required variables using active definitions (may be overridden)
      if (selectedTemplate.preprocessing?.enableVariables) {
        const missingVars = validateRequiredVariables(
          selectedTemplate.prompt,
          variableValues,
          activeVariableDefinitions,
        );
        if (missingVars.length > 0) {
          toast.error('Missing required variables', {
            description: `Please fill: ${missingVars.join(', ')}`,
          });
          return;
        }
      }

      const formData: GenerationFormData = {
        ...buildGenerationFormData(selectedTemplate, variableValues, language),
        prompt: finalPrompt,
        platform, // Add platform selection for automate mode
      };
      onSubmitWithAutomate(formData);
    },
    [
      selectedTemplate,
      variableValues,
      language,
      finalPrompt,
      activeVariableDefinitions,
      platform,
      onSubmitWithAutomate,
    ],
  );

  // Note: VariableInputs component is keyed by template ID, so it will re-mount
  // and populate defaults automatically when template changes

  // Check if template is selected
  if (!selectedTemplate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-yellow-500" />
            Chưa chọn template
          </CardTitle>
          <CardDescription>
            Để tạo kịch bản bằng AI, vui lòng chọn một template từ thư viện ở trên. Template giúp AI tạo nội dung chất
            lượng cao và phù hợp với yêu cầu của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            💡 Mẹo: Bạn có thể tìm kiếm template theo thể loại, từ khóa hoặc xem các template đề xuất.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Type guard: selectedTemplate is PromptRecord from this point

  return (
    <div className="space-y-6">
      {/* Variable Inputs (if template has variables) */}
      {activeTemplate.preprocessing?.enableVariables && activeVariableDefinitions && selectedTemplate?.id && (
        <VariableInputs
          key={`${selectedTemplate.id}-${overriddenTemplate ? 'custom' : 'original'}`}
          variableDefinitions={activeVariableDefinitions}
          promptTemplate={selectedTemplate.prompt}
          templateId={selectedTemplate.id}
          onChange={setVariableValues}
          onCopyPrompt={handleCopyPrompt}
        />
      )}

      {/* Platform Selector for Automate Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chọn nền tảng (Chế độ Automate)</CardTitle>
          <CardDescription>Chọn nền tảng AI mà bạn muốn mở để tạo kịch bản tự động</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={platform} onValueChange={(value: AIPlatform) => setPlatform(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="aistudio" id="aistudio" />
              <Label htmlFor="aistudio" className="cursor-pointer font-normal">
                <strong>AI Studio</strong> (aistudio.google.com) - Chính thức, tính năng đầy đủ
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gemini-web" id="gemini-web" />
              <Label htmlFor="gemini-web" className="cursor-pointer font-normal">
                <strong>Gemini Web</strong> (gemini.google.com/app) - Giao diện chat đơn giản
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Dual submit buttons */}
      <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="default"
          className="w-full"
          onClick={handleSubmitWithAPI}
          disabled={isLoading || !isApiKeySet}>
          <Sparkles className="mr-2 size-4" />
          {isLoading ? 'Đang tạo...' : 'Tạo bằng API'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleSubmitWithAutomation}
          disabled={isLoading || !isApiKeySet}>
          <Sparkles className="mr-2 size-4" />
          Tạo bằng Automate
        </Button>
      </div>

      <p className="text-muted-foreground text-center">
        <strong>API:</strong> Gọi trực tiếp Google AI Studio API để tạo kịch bản
        <br />
        <strong>Automate:</strong> Mở nền tảng đã chọn và tự động điền prompt, bạn có thể chỉnh sửa trước khi gửi
      </p>
    </div>
  );
};
