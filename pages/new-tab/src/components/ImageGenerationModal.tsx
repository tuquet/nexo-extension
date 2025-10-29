import { useState, useEffect } from 'react';
import type { AspectRatio } from '../types';
import type React from 'react';

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (finalPrompt: string, finalNegativePrompt: string, finalAspectRatio: AspectRatio) => void;
  initialPrompt: string;
  initialNegativePrompt: string;
  initialAspectRatio: AspectRatio;
  isGenerating: boolean;
}

const ImageGenerationModal: React.FC<ImageGenerationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialPrompt,
  initialNegativePrompt,
  initialAspectRatio,
  isGenerating,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [negativePrompt, setNegativePrompt] = useState(initialNegativePrompt);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
      setNegativePrompt(initialNegativePrompt);
      setAspectRatio(initialAspectRatio);
    }
  }, [isOpen, initialPrompt, initialNegativePrompt, initialAspectRatio]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(prompt, negativePrompt, aspectRatio);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-opacity">
      {/* Fullscreen native button as backdrop close control (keyboard + pointer accessible) */}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 z-0 bg-transparent"
        onClick={onClose}
      />

      <div
        className="z-10 w-full max-w-2xl transform space-y-4 rounded-lg bg-white p-6 shadow-xl transition-all dark:bg-slate-800"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cấu hình tạo ảnh</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Câu lệnh (Prompt)
            </label>
            <textarea
              id="prompt"
              rows={5}
              className="focus:border-primary focus:ring-primary/20 block w-full rounded-lg border-slate-300 bg-white shadow-sm transition focus:ring-2 disabled:opacity-70 sm:text-sm dark:border-slate-600 dark:bg-slate-700"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div>
            <label
              htmlFor="negativePrompt"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Câu lệnh phủ định (Negative Prompt)
            </label>
            <textarea
              id="negativePrompt"
              rows={3}
              className="focus:border-primary focus:ring-primary/20 block w-full rounded-lg border-slate-300 bg-white shadow-sm transition focus:ring-2 disabled:opacity-70 sm:text-sm dark:border-slate-600 dark:bg-slate-700"
              value={negativePrompt}
              onChange={e => setNegativePrompt(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div>
            <label
              htmlFor="aspectRatioModal"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Tỷ lệ khung hình
            </label>
            <select
              id="aspectRatioModal"
              className="focus:border-primary focus:ring-primary/20 block w-full rounded-lg border-slate-300 bg-white py-2 pl-3 pr-10 text-base shadow-sm transition focus:ring-2 disabled:opacity-70 sm:text-sm dark:border-slate-600 dark:bg-slate-700"
              value={aspectRatio}
              onChange={e => setAspectRatio(e.target.value as AspectRatio)}
              disabled={isGenerating}>
              <option value="16:9">16:9 (Ngang)</option>
              <option value="9:16">9:16 (Dọc)</option>
              <option value="1:1">1:1 (Vuông)</option>
              <option value="4:3">4:3 (Cổ điển)</option>
              <option value="3:4">3:4 (Chân dung)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
              disabled={isGenerating}>
              Hủy
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark inline-flex items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
                  <span>Đang tạo...</span>
                </>
              ) : (
                'Tạo ảnh'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImageGenerationModal;
