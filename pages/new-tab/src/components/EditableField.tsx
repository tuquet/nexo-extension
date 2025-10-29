import { enhanceText } from '../services/geminiService';
import { useApiKey } from '../stores/useApiKey';
import { useState, useRef, useEffect } from 'react';
import type React from 'react';

interface EditableFieldProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  context: string; // e.g., "Movie Logline", "Scene Action"
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
      const enhancedValue = await enhanceText(value, context, language, apiKey);
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

  if (isEditing) {
    const InputComponent = as;
    return (
      <div className={`w-full ${className}`}>
        <InputComponent
          ref={inputRef as React.RefObject<HTMLTextAreaElement & HTMLInputElement>}
          value={value}
          onChange={handleChange}
          className="focus:border-primary focus:ring-primary/20 block w-full resize-none rounded-md border-slate-300 bg-white shadow-sm transition focus:ring-2 sm:text-sm dark:border-slate-600 dark:bg-slate-700"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            onClick={handleEnhance}
            disabled={isEnhancing || !value.trim() || !apiKey}
            title={!apiKey ? 'Vui lòng đặt khóa API trong cài đặt để sử dụng tính năng này' : ''}
            className="border-primary/50 text-primary hover:bg-primary/10 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60">
            {isEnhancing ? (
              <span className="border-primary/50 border-t-primary h-3 w-3 animate-spin rounded-full border-2"></span>
            ) : (
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            Nâng cao
          </button>
          <button
            onClick={handleCancel}
            className="rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="bg-primary hover:bg-primary-dark rounded-md px-2 py-1 text-xs font-semibold text-white transition-colors">
            Lưu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative min-h-[24px] cursor-pointer ${className}`}>
      <div className={textClassName}>{initialValue || <span className="italic text-slate-400">Trống</span>}</div>
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
