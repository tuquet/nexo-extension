import { Button, Card, CardDescription, CardHeader, CardTitle, toast } from '@extension/ui';
import { DualModeEditor } from '@src/components/common/dual-mode-editor';
import { PromptEditor } from '@src/components/prompts/prompt-editor';
import { DEFAULT_PROMPT_TEMPLATE } from '@src/constants/prompt-defaults';
import { validatePromptJSON } from '@src/utils/prompt-validation';
import { AlertCircle, Edit } from 'lucide-react';
import { useState } from 'react';
import type { PromptRecord } from '@extension/database';
import type { ReactElement } from 'react';

interface TemplateCustomizerProps {
  template: PromptRecord;
  onOverrideChange: (updatedTemplate: Partial<PromptRecord>) => void;
}

interface PromptFormData extends Record<string, unknown> {
  title: string;
  category: PromptRecord['category'];
  prompt: string;
  description?: string;
  tags?: string[];
  icon?: string;
  systemInstruction?: string;
  outputFormat?: string;
  modelSettings?: {
    preferredModel?: string;
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
  preprocessing?: {
    enableVariables?: boolean;
    variableDefinitions?: string;
    injectContext?: boolean;
  };
  postprocessing?: {
    steps?: Array<'trim' | 'remove-quotes' | 'parse-json' | 'extract-field'>;
  };
}

const TemplateCustomizer = ({ template, onOverrideChange }: TemplateCustomizerProps): ReactElement => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const hasCustomOverride = () => {
    const stored = localStorage.getItem(`template-override-${template.id}`);
    return !!stored;
  };

  const handleSave = (updatedData: PromptFormData) => {
    try {
      // Save to localStorage
      localStorage.setItem(`template-override-${template.id}`, JSON.stringify(updatedData));

      // Notify parent
      onOverrideChange(updatedData);

      toast.success('Template customized', {
        description: 'All changes saved locally',
      });
    } catch (error) {
      toast.error('Failed to save customization', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <>
      <Card
        className={
          hasCustomOverride()
            ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
            : 'bg-slate-50 dark:bg-slate-900/50'
        }>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-base">
                {template.icon} {template.title}
                {hasCustomOverride() && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                    <AlertCircle className="size-3" />
                    Customized
                  </span>
                )}
              </CardTitle>
              <CardDescription className="mt-1">{template.description}</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditorOpen(true)} className="gap-1">
              <Edit className="size-3" />
              Customize
            </Button>
          </div>
        </CardHeader>
      </Card>

      <DualModeEditor<PromptFormData>
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        onSubmit={handleSave}
        initialData={template as unknown as PromptFormData}
        defaultTemplate={DEFAULT_PROMPT_TEMPLATE as PromptFormData}
        mode="edit"
        validateJSON={validatePromptJSON}
        renderUIEditor={({ open, onOpenChange, data, onSave, title, description, onSwitchToJSON }) => (
          <PromptEditor
            open={open}
            onOpenChange={onOpenChange}
            initialData={data as unknown as PromptRecord}
            onSave={onSave}
            title={title}
            description={description}
            onSwitchToJSON={onSwitchToJSON}
          />
        )}
        title={{
          create: `Customize Template: ${template.title}`,
          edit: `Customize Template: ${template.title}`,
          createJSON: `Customize Template (JSON): ${template.title}`,
          editJSON: `Customize Template (JSON): ${template.title}`,
        }}
        description={{
          ui: "Edit all template settings. Changes are saved locally and don't affect the original template.",
          json: 'Advanced JSON editing mode for power users. Changes are saved locally.',
        }}
        fieldsToExclude={['id', 'createdAt', 'updatedAt']}
        helpText={{
          requiredFields: 'Required fields: title, category, prompt.',
          validationRules:
            'Valid categories: script-generation, image-generation, video-generation, character-dev, general.',
        }}
      />
    </>
  );
};

export { TemplateCustomizer };
