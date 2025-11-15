import { Alert, AlertDescription, Input, Textarea, Button } from '@extension/ui';
import { enhanceText } from '@src/services/background-api';
import { validateDialogueLine } from '@src/services/validation-service';
import { useApiKey } from '@src/stores/use-api-key';
import { useModelSettings } from '@src/stores/use-model-settings';
import { AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type React from 'react';

interface EditableFieldProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  context: string;
  language: 'en-US' | 'vi-VN';
  as?: 'textarea' | 'input';
  className?: string;
  textClassName?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  initialValue,
  onSave,
  context,
  language,
  as = 'textarea',
  className = '',
  textClassName = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const { apiKey } = useApiKey();
  const { model } = useModelSettings();

  // Check if this field is for dialogue (affects TTS quality)
  const isDialogueField = context.toLowerCase().includes('dialogue');
  const validation = isDialogueField ? validateDialogueLine(value) : { isValid: true, warnings: [] };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (as === 'textarea' && inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      }
    }
  }, [isEditing, as]);

  const handleSave = () => {
    onSave(value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const handleEnhance = async () => {
    if (!value.trim() || !apiKey) return;
    setIsEnhancing(true);
    try {
      const enhancedValue = await enhanceText({
        text: value,
        context: `${context} (Language: ${language})`,
        apiKey,
        modelName: model,
      });
      setValue(enhancedValue);
    } catch (error) {
      console.error('Failed to enhance text:', error);
      // alert() is blocked in sandboxed environments. The user will see the spinner stop, indicating the operation failed.
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setValue(e.target.value);
    if (as === 'textarea' && e.target instanceof HTMLTextAreaElement) {
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    // Stop propagation to prevent parent handlers (DndContext) from interfering
    e.stopPropagation();

    // Cancel on Escape (works for both textarea and input)
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
      return;
    }

    // For textarea: Enter alone creates newline, Ctrl+Enter saves
    if (as === 'textarea') {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
        return;
      }
      // Allow plain Enter to work normally (create newline)
      // Don't preventDefault - we need the newline to be inserted
      return;
    }

    // For input fields: Enter saves
    if (e.key === 'Enter' && as === 'input') {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    const InputComponent = as === 'textarea' ? Textarea : Input;
    return (
      <div className={`w-full ${className}`}>
        <InputComponent
          ref={inputRef as React.RefObject<HTMLTextAreaElement & HTMLInputElement>}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="block w-full resize-none"
        />
        {!validation.isValid && validation.warnings.length > 0 && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        <div className="mt-2 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEnhance}
            disabled={isEnhancing || !value.trim() || !apiKey}
            title={!apiKey ? 'Vui lòng đặt khóa API trong cài đặt để sử dụng tính năng này' : ''}>
            {isEnhancing ? (
              <span className="border-primary/50 border-t-primary h-3 w-3 animate-spin rounded-full border-2" />
            ) : (
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            Nâng cao
          </Button>
          <Button variant="secondary" onClick={handleCancel} size="sm">
            Hủy
          </Button>
          <Button variant="default" onClick={handleSave} size="sm">
            Lưu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative min-h-[24px] cursor-pointer ${className}`}>
      <div className={textClassName}>
        {initialValue !== null && initialValue !== undefined && initialValue !== '' ? (
          initialValue
        ) : (
          <span className="italic text-slate-400">Trống</span>
        )}
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 opacity-0 shadow-sm outline-none transition-opacity focus:opacity-100 group-hover:opacity-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400"
        aria-label={`Sửa ${context}`}
        title={`Sửa ${context}`}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
          />
        </svg>
      </button>
    </div>
  );
};

export default EditableField;
