import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@extension/ui';
import { StandardDialog } from '@src/components/common/standard-dialog';
import { useEffect, useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(prompt, negativePrompt, aspectRatio);
  };

  return (
    <StandardDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      title="Cấu hình tạo ảnh"
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={isGenerating}>
            Hủy
          </Button>
          <Button type="submit" form="image-generation-form" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"></div>
                <span>Đang tạo...</span>
              </>
            ) : (
              'Tạo ảnh'
            )}
          </Button>
        </>
      }>
      <form id="image-generation-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="prompt">Câu lệnh (Prompt)</Label>
          <Textarea
            id="prompt"
            rows={5}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={isGenerating}
          />
        </div>
        <div>
          <Label htmlFor="negativePrompt">Câu lệnh phủ định (Negative Prompt)</Label>
          <Textarea
            id="negativePrompt"
            rows={3}
            value={negativePrompt}
            onChange={e => setNegativePrompt(e.target.value)}
            disabled={isGenerating}
          />
        </div>
        <div>
          <Label htmlFor="aspectRatioModal">Tỷ lệ khung hình</Label>
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
      </form>
    </StandardDialog>
  );
};

export default ImageGeneration;
