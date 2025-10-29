import { useApiKey } from '../stores/useApiKey';
import { useState, useEffect } from 'react';
import type React from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey } = useApiKey();
  const [localKey, setLocalKey] = useState(apiKey || '');

  useEffect(() => {
    setLocalKey(apiKey || '');
  }, [apiKey, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(localKey);
    onClose();
  };

  // Close only when clicking the overlay itself (not the content)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Allow keyboard users to activate the overlay (Enter / Space)
  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Only close if the overlay itself is the event target
      if (e.target === e.currentTarget) {
        e.preventDefault();
        onClose();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
      role="button"
      tabIndex={0}
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}>
      <div className="w-full max-w-lg transform space-y-4 rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cài đặt Khóa API</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
            &times;
          </button>
        </div>
        <div>
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
            Vui lòng nhập khóa API Gemini của bạn. Khóa của bạn sẽ được lưu trữ an toàn trong trình duyệt của bạn.
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary ml-1 hover:underline">
              Lấy khóa API tại đây
            </a>
            .
          </p>
          <input
            type="password"
            value={localKey}
            onChange={e => setLocalKey(e.target.value)}
            placeholder="Dán khóa API của bạn vào đây"
            className="focus:border-primary focus:ring-primary/20 block w-full rounded-lg border-slate-300 bg-white shadow-sm transition focus:ring-2 sm:text-sm dark:border-slate-600 dark:bg-slate-700"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-primary hover:bg-primary-dark rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors">
            Lưu Khóa API
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
