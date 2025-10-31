import {
  AVAILABLE_IMAGE_MODELS,
  AVAILABLE_TEXT_MODELS,
  AVAILABLE_TTS_MODELS,
  AVAILABLE_VIDEO_MODELS,
} from '../../constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, Slider } from '@extension/ui';
import { useModelSettings } from '@src/stores/use-model-settings';

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
        <Label htmlFor="scriptModel">Model tạo văn bản</Label>
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
        <Label htmlFor="imageModel">Model tạo ảnh</Label>
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
        <Label htmlFor="videoModel">Model tạo video</Label>
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
        <Label htmlFor="ttsModel">Model tạo giọng nói (TTS)</Label>
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
        <Label htmlFor="temperature">Nhiệt độ: {temperature.toFixed(2)}</Label>
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
        <Label htmlFor="topP">Top P: {topP.toFixed(2)}</Label>
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
