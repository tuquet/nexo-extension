import {
  Button,
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@extension/ui';
import { useState, useEffect } from 'react';
import type { AspectRatio } from '@src/types';
import type React from 'react';

interface ImageGenerationProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (finalPrompt: string, finalNegativePrompt: string, finalAspectRatio: AspectRatio) => void;
  initialPrompt: string;
  initialNegativePrompt: string;
  initialAspectRatio: AspectRatio;
  isGenerating: boolean;
}

const ImageGeneration: React.FC<ImageGenerationProps> = ({
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

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(prompt, negativePrompt, aspectRatio);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Cấu hình tạo ảnh</DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <label htmlFor="prompt" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Câu lệnh (Prompt)
              </label>
              <Textarea
                id="prompt"
                rows={5}
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
              <Textarea
                id="negativePrompt"
                rows={3}
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
              <Select value={aspectRatio} onValueChange={v => setAspectRatio(v as AspectRatio)} disabled={isGenerating}>
                <SelectTrigger id="aspectRatioModal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Ngang)</SelectItem>
                  <SelectItem value="9:16">9:16 (Dọc)</SelectItem>
                  <SelectItem value="1:1">1:1 (Vuông)</SelectItem>
                  <SelectItem value="4:3">4:3 (Cổ điển)</SelectItem>
                  <SelectItem value="3:4">3:4 (Chân dung)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isGenerating}>
                Hủy
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  'Tạo ảnh'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default ImageGeneration;
