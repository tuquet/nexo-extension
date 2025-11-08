/**
 * Generic JSON Editor Component
 * Reusable for import/export/edit JSON data
 * Eliminates duplication across Script/Prompt/Settings features
 */

import { Alert, AlertDescription, Button, Label, Textarea } from '@extension/ui';
import { AlertCircle, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: unknown;
}

interface JsonEditorProps<T = unknown> {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (data: T) => void;
  validateJSON?: (jsonString: string) => ValidationResult;
  placeholder?: string;
  rows?: number;
  mode: 'import' | 'export' | 'edit';
  helpText?: string;
  showFileUpload?: boolean;
  onFileUpload?: (file: File) => void;
  disabled?: boolean;
  label?: string;
  submitButtonText?: string;
  fileUploadButtonText?: string;
}

const JsonEditor = <T,>({
  value,
  onChange,
  onSubmit,
  validateJSON,
  placeholder = 'Paste JSON content here...',
  rows = 15,
  mode,
  helpText,
  showFileUpload = false,
  onFileUpload,
  disabled = false,
  label,
  submitButtonText,
  fileUploadButtonText = 'Upload File',
}: JsonEditorProps<T>): ReactElement => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearError = () => setError(null);

  const handleSubmit = () => {
    clearError();

    if (!value.trim()) {
      setError('Please enter JSON content');
      return;
    }

    if (validateJSON) {
      const validation = validateJSON(value);
      if (!validation.isValid) {
        setError(validation.error || 'Validation failed');
        return;
      }
      onSubmit(validation.data as T);
    } else {
      try {
        const parsed = JSON.parse(value);
        onSubmit(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON format');
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearError();

    if (onFileUpload) {
      onFileUpload(file);
    } else {
      // Default file handling: read and set to textarea
      try {
        const text = await file.text();
        JSON.parse(text); // Validate JSON
        onChange(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON file');
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getDefaultSubmitText = () => {
    if (submitButtonText) return submitButtonText;
    switch (mode) {
      case 'import':
        return 'Import';
      case 'export':
        return 'Export';
      case 'edit':
        return 'Apply Changes';
      default:
        return 'Submit';
    }
  };

  return (
    <div className="space-y-4">
      {label && <Label htmlFor="json-editor">{label}</Label>}

      <Textarea
        id="json-editor"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          clearError();
        }}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className="font-mono text-sm"
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {helpText && <p className="text-muted-foreground text-sm">{helpText}</p>}

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={disabled} className="flex-1">
          {getDefaultSubmitText()}
        </Button>

        {showFileUpload && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 gap-2">
              <Upload className="size-4" />
              {fileUploadButtonText}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled}
            />
          </>
        )}
      </div>
    </div>
  );
};

export { JsonEditor };
export type { JsonEditorProps, ValidationResult };
