/**
 * Prompt Form Component - Simplified JSON Editor
 * Create/edit prompts using JSON textarea
 */

import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@extension/ui';
import { AlertCircle, FileJson } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PromptRecord } from '@src/db';

interface PromptFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PromptFormData) => void;
  initialData?: PromptRecord;
  mode: 'create' | 'edit';
}

interface PromptFormData {
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

const DEFAULT_PROMPT_TEMPLATE = {
  title: 'New Prompt',
  category: 'general',
  prompt: 'Your prompt template here...',
  description: '',
  tags: [],
  icon: '💡',
  systemInstruction: '',
  outputFormat: 'json-structured',
  modelSettings: {
    preferredModel: 'gemini-2.5-flash',
    temperature: 1.0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  },
  preprocessing: {
    enableVariables: false,
    variableDefinitions: '',
    injectContext: false,
  },
  postprocessing: {
    steps: ['trim', 'parse-json'],
  },
};

const PromptForm = ({ open, onOpenChange, onSubmit, initialData, mode }: PromptFormProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Convert initialData or default template to formatted JSON
      const dataToEdit = initialData || DEFAULT_PROMPT_TEMPLATE;
      // Remove id, createdAt, updatedAt from display
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...editableData } = dataToEdit as PromptRecord;
      setJsonInput(JSON.stringify(editableData, null, 2));
      setJsonError(null);
    }
  }, [initialData, open]);

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    setJsonError(null);
  };

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput) as PromptFormData;

      // Validate required fields
      if (!parsed.title || !parsed.title.trim()) {
        setJsonError('Field "title" is required');
        return;
      }
      if (!parsed.category) {
        setJsonError('Field "category" is required');
        return;
      }
      if (!parsed.prompt || !parsed.prompt.trim()) {
        setJsonError('Field "prompt" is required');
        return;
      }

      // Valid categories
      const validCategories = ['script-generation', 'image-generation', 'video-generation', 'character-dev', 'general'];
      if (!validCategories.includes(parsed.category)) {
        setJsonError(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
        return;
      }

      onSubmit(parsed);
      onOpenChange(false);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="size-5" />
            {mode === 'create' ? 'Create New Prompt (JSON)' : 'Edit Prompt (JSON)'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* JSON Editor */}
          <div className="grid gap-2">
            <Label htmlFor="jsonEditor">Prompt Configuration (JSON)</Label>
            <Textarea
              id="jsonEditor"
              placeholder="Paste or edit JSON configuration..."
              value={jsonInput}
              onChange={e => handleJsonChange(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-xs">
              Edit the JSON object above. Required fields: <code className="bg-muted rounded px-1">title</code>,{' '}
              <code className="bg-muted rounded px-1">category</code>,{' '}
              <code className="bg-muted rounded px-1">prompt</code>
            </p>
          </div>

          {/* Error Alert */}
          {jsonError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{jsonError}</AlertDescription>
            </Alert>
          )}

          {/* Help Text */}
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Valid categories:</strong> script-generation, image-generation, video-generation, character-dev,
              general
              <br />
              <strong>Example:</strong> See default template when creating new prompt
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{mode === 'create' ? 'Create Prompt' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { PromptForm };
export type { PromptFormData };
