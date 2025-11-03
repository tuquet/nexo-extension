import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@extension/ui';
import { AVAILABLE_IMAGE_MODELS, AVAILABLE_TEXT_MODELS, AVAILABLE_VIDEO_MODELS } from '@src/constants';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type React from 'react';

interface AdvancedModelOptionsProps {
  scriptModel: string;
  onScriptModelChange: (value: string) => void;
  suggestionModel: string;
  onSuggestionModelChange: (value: string) => void;
  imageModel: string;
  onImageModelChange: (value: string) => void;
  videoModel: string;
  onVideoModelChange: (value: string) => void;
  disabled?: boolean;
  isSuggesting?: boolean;
}

const AdvancedModelOptions: React.FC<AdvancedModelOptionsProps> = ({
  scriptModel,
  onScriptModelChange,
  suggestionModel,
  onSuggestionModelChange,
  imageModel,
  onImageModelChange,
  videoModel,
  onVideoModelChange,
  disabled = false,
  isSuggesting = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(true);

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-600">
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
        <span>Tùy chọn nâng cao</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 pt-2 sm:grid-cols-2">
          <div>
            <label htmlFor="scriptModel" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Model tạo kịch bản
            </label>
            <Select value={scriptModel} onValueChange={onScriptModelChange} disabled={disabled}>
              <SelectTrigger id="scriptModel" className="focus:border-primary focus:ring-primary/20 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TEXT_MODELS.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              htmlFor="suggestionModel"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Model gợi ý tình tiết
            </label>
            <Select value={suggestionModel} onValueChange={onSuggestionModelChange} disabled={disabled || isSuggesting}>
              <SelectTrigger id="suggestionModel" className="focus:border-primary focus:ring-primary/20 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TEXT_MODELS.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="imageModel" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Model tạo ảnh
            </label>
            <Select value={imageModel} onValueChange={onImageModelChange} disabled={disabled}>
              <SelectTrigger id="imageModel" className="focus:border-primary focus:ring-primary/20 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_IMAGE_MODELS.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="videoModel" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Model tạo video
            </label>
            <Select value={videoModel} onValueChange={onVideoModelChange} disabled={disabled}>
              <SelectTrigger id="videoModel" className="focus:border-primary focus:ring-primary/20 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_VIDEO_MODELS.map(model => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedModelOptions;
