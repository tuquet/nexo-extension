/**
 * Prompt Form Component - Refactored to use Generic DualModeEditor
 * Create/edit prompts using JSON textarea OR visual UI editor (PromptEditor)
 */

import { DualModeEditor } from '@src/components/common/dual-mode-editor';
import { PromptEditor } from '@src/components/prompts';
import { DEFAULT_PROMPT_TEMPLATE } from '@src/constants/prompt-defaults';
import { validatePromptJSON } from '@src/utils/prompt-validation';
import type { PromptRecord } from '@src/db';

interface PromptFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PromptFormData) => void;
  initialData?: PromptRecord;
  mode: 'create' | 'edit';
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

const PromptForm = ({ open, onOpenChange, onSubmit, initialData, mode }: PromptFormProps) => (
  <DualModeEditor<PromptFormData>
    open={open}
    onOpenChange={onOpenChange}
    onSubmit={onSubmit}
    initialData={initialData as unknown as PromptFormData}
    defaultTemplate={DEFAULT_PROMPT_TEMPLATE as PromptFormData}
    mode={mode}
    validateJSON={validatePromptJSON}
    renderUIEditor={({
      open: uiOpen,
      onOpenChange: uiOnOpenChange,
      data,
      onSave,
      title,
      description,
      onSwitchToJSON,
    }) => (
      <PromptEditor
        open={uiOpen}
        onOpenChange={uiOnOpenChange}
        initialData={data as unknown as PromptRecord}
        onSave={onSave}
        title={title}
        description={description}
        onSwitchToJSON={onSwitchToJSON}
      />
    )}
    title={{
      create: 'Create New Prompt',
      edit: 'Edit Prompt',
      createJSON: 'Create New Prompt (JSON)',
      editJSON: 'Edit Prompt (JSON)',
    }}
    description={{
      ui: 'Use form fields below to configure the prompt. Switch to JSON mode for advanced editing.',
      json: 'Edit the JSON object above.',
    }}
    fieldsToExclude={['id', 'createdAt', 'updatedAt']}
    helpText={{
      requiredFields: 'Required fields: title, category, prompt. All other fields are optional with sensible defaults.',
      validationRules:
        'Valid categories: script-generation, image-generation, video-generation, character-dev, general. See default template for structure reference.',
    }}
  />
);

export { PromptForm };
export type { PromptFormData };
