/**
 * Generic Dual-Mode Editor Component
 * Provides UI/JSON editing modes for any data type
 * Highly reusable for prompts, scripts, settings, etc.
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
import { AlertCircle, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: unknown;
}

interface DualModeEditorProps<T extends Record<string, unknown>> {
  // Dialog control
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Data management
  onSubmit: (data: T) => void;
  initialData?: T;
  defaultTemplate: T;
  mode: 'create' | 'edit';

  // Validation
  validateJSON?: (jsonString: string) => ValidationResult;
  requiredFields?: string[];

  // UI mode rendering
  renderUIEditor: (props: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: T;
    onSave: (data: Partial<T>) => void;
    title: string;
    description?: string;
    onSwitchToJSON?: () => void;
  }) => ReactElement;

  // Configuration
  title?: {
    create: string;
    edit: string;
    createJSON?: string;
    editJSON?: string;
  };
  description?: {
    ui?: string;
    json?: string;
  };
  fieldsToExclude?: string[];
  helpText?: {
    requiredFields?: string;
    validationRules?: string;
  };
}

const DualModeEditor = <T extends Record<string, unknown>>({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  defaultTemplate,
  mode,
  validateJSON,
  renderUIEditor,
  title = {
    create: 'Create New Item',
    edit: 'Edit Item',
    createJSON: 'Create New Item (JSON)',
    editJSON: 'Edit Item (JSON)',
  },
  description,
  fieldsToExclude = ['id', 'createdAt', 'updatedAt'],
  helpText,
}: DualModeEditorProps<T>): ReactElement => {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'ui' | 'json'>('ui');

  // Sync JSON input when dialog opens or data changes
  useEffect(() => {
    if (open) {
      const dataToEdit = initialData || defaultTemplate;

      // Remove excluded fields from JSON display
      const editableData = { ...dataToEdit };
      fieldsToExclude.forEach(field => {
        delete editableData[field];
      });

      setJsonInput(JSON.stringify(editableData, null, 2));
      setJsonError(null);
    }
  }, [initialData, open, defaultTemplate, fieldsToExclude]);

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    setJsonError(null);
  };

  const handleUISubmit = (data: Partial<T>) => {
    onSubmit(data as T);
    onOpenChange(false);
  };

  const handleJsonSubmit = () => {
    if (!validateJSON) {
      // No validation provided, just parse
      try {
        const parsed = JSON.parse(jsonInput) as T;
        onSubmit(parsed);
        onOpenChange(false);
      } catch (error) {
        setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
      }
      return;
    }

    // Use provided validation
    const validation = validateJSON(jsonInput);

    if (!validation.isValid) {
      setJsonError(validation.error || 'Validation failed');
      return;
    }

    onSubmit(validation.data as T);
    onOpenChange(false);
  };

  const switchToUI = () => setEditMode('ui');
  const switchToJSON = () => setEditMode('json');

  const dataToEdit = initialData || defaultTemplate;

  // Render UI mode
  if (editMode === 'ui') {
    return renderUIEditor({
      open,
      onOpenChange,
      data: dataToEdit,
      onSave: handleUISubmit,
      title: mode === 'create' ? title.create : title.edit,
      description: description?.ui,
      onSwitchToJSON: switchToJSON,
    });
  }

  // Render JSON mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{mode === 'create' ? title.createJSON || title.create : title.editJSON || title.edit}</span>
            <Button variant="ghost" size="sm" onClick={switchToUI} className="gap-2">
              <Pencil className="size-4" />
              Switch to Visual Editor
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="w-full">
          <div className="mt-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="jsonEditor">Configuration (JSON)</Label>
              <Textarea
                id="jsonEditor"
                placeholder="Paste or edit JSON configuration..."
                value={jsonInput}
                onChange={e => handleJsonChange(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
              {helpText?.requiredFields && <p className="text-muted-foreground text-sm">{helpText.requiredFields}</p>}
            </div>

            {/* Error Alert */}
            {jsonError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{jsonError}</AlertDescription>
              </Alert>
            )}

            {/* Help Text */}
            {helpText?.validationRules && (
              <Alert>
                <AlertDescription>{helpText.validationRules}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleJsonSubmit}>{mode === 'create' ? 'Create' : 'Save Changes'}</Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { DualModeEditor };
export type { DualModeEditorProps, ValidationResult };
