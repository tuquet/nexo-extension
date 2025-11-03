import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Slider,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@extension/ui';
import {
  AVAILABLE_IMAGE_MODELS,
  AVAILABLE_TEXT_MODELS,
  AVAILABLE_TTS_MODELS,
  AVAILABLE_VIDEO_MODELS,
} from '@src/constants';
import { useModelSettings } from '@src/stores/use-model-settings';
import { HelpCircle } from 'lucide-react';

const LabelWithTooltip: React.FC<{ htmlFor: string; children: React.ReactNode; tooltip: string }> = ({
  htmlFor,
  children,
  tooltip,
}) => (
  <div className="flex items-center gap-1.5">
    <Label htmlFor={htmlFor}>{children}</Label>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 cursor-help text-slate-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

interface ModelSettingsProps {
  disabled?: boolean;
}

export const ModelSettings: React.FC<ModelSettingsProps> = ({ disabled }) => {
  const {
    model,
    temperature,
    topP,
    imageModel,
    videoModel,
    ttsModel,
    setModel,
    setTemperature,
    setTopP,
    setImageModel,
    setVideoModel,
    setTtsModel,
  } = useModelSettings();

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-6 pt-2 sm:grid-cols-2">
      <div>
        <LabelWithTooltip htmlFor="scriptModel" tooltip="Chọn model AI để tạo nội dung kịch bản chính.">
          Model tạo văn bản
        </LabelWithTooltip>
        <Select value={model} onValueChange={setModel} disabled={disabled}>
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
        <LabelWithTooltip htmlFor="imageModel" tooltip="Chọn model AI để tạo hình ảnh cho các cảnh.">
          Model tạo ảnh
        </LabelWithTooltip>
        <Select value={imageModel} onValueChange={setImageModel} disabled={disabled}>
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
        <LabelWithTooltip htmlFor="videoModel" tooltip="Chọn model AI để tạo video cho các cảnh.">
          Model tạo video
        </LabelWithTooltip>
        <Select value={videoModel} onValueChange={setVideoModel} disabled={disabled}>
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
      <div>
        <LabelWithTooltip
          htmlFor="ttsModel"
          tooltip="Chọn model AI để chuyển văn bản thành giọng nói (Text-to-Speech).">
          Model tạo giọng nói (TTS)
        </LabelWithTooltip>
        <Select value={ttsModel} onValueChange={setTtsModel} disabled={disabled || AVAILABLE_TTS_MODELS.length === 0}>
          <SelectTrigger id="ttsModel" className="focus:border-primary focus:ring-primary/20 w-full">
            <SelectValue placeholder="Chưa có model" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_TTS_MODELS.length > 0 ? (
              AVAILABLE_TTS_MODELS.map(model => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled={true}></SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <LabelWithTooltip
          htmlFor="temperature"
          tooltip="Kiểm soát mức độ sáng tạo của AI. Giá trị cao hơn (ví dụ: 0.9) cho kết quả đa dạng hơn, giá trị thấp hơn (ví dụ: 0.2) cho kết quả nhất quán hơn.">
          Nhiệt độ: {temperature.toFixed(2)}
        </LabelWithTooltip>
        <Slider
          id="temperature"
          min={0}
          max={1}
          step={0.01}
          value={[temperature]}
          onValueChange={([value]: number[]) => setTemperature(value)}
          disabled={disabled}
        />
      </div>
      <div>
        <LabelWithTooltip
          htmlFor="topP"
          tooltip="Một cách khác để kiểm soát sự ngẫu nhiên. AI sẽ chỉ xem xét các token có xác suất tích lũy đạt đến giá trị này. Thường không nên chỉnh cả Nhiệt độ và Top P cùng lúc.">
          Top P: {topP.toFixed(2)}
        </LabelWithTooltip>
        <Slider
          id="topP"
          min={0}
          max={1}
          step={0.01}
          value={[topP]}
          onValueChange={([value]: number[]) => setTopP(value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
