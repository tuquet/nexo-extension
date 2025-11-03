import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
  toast,
} from '@extension/ui';
import { useState, useEffect } from 'react';

const AVAILABLE_TEXT_MODELS = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (High Quality)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast & Efficient)' },
];

const AVAILABLE_IMAGE_MODELS = [
  { value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 (High Quality)' },
  { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash (Fast & Efficient)' },
];

const AVAILABLE_VIDEO_MODELS = [
  { value: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast (Preview)' },
  { value: 'veo-3.0-standard-generate', label: 'Veo 3.0 Standard' },
  { value: 'veo-4.0-hq-generate', label: 'Veo 4.0 HQ (High Quality)' },
];

const AIModelsTab = () => {
  const [textModel, setTextModel] = useState('gemini-2.5-flash');
  const [imageModel, setImageModel] = useState('gemini-2.5-flash-image');
  const [videoModel, setVideoModel] = useState('veo-3.1-fast-generate-preview');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.95);

  useEffect(() => {
    // Load from chrome.storage
    chrome.storage.local.get(['cinegenie-model-settings'], result => {
      const settings = result['cinegenie-model-settings'];
      if (settings?.state) {
        if (settings.state.model) setTextModel(settings.state.model);
        if (settings.state.imageModel) setImageModel(settings.state.imageModel);
        if (settings.state.videoModel) setVideoModel(settings.state.videoModel);
        if (settings.state.temperature !== undefined) setTemperature(settings.state.temperature);
        if (settings.state.topP !== undefined) setTopP(settings.state.topP);
      }
    });
  }, []);

  const handleSave = async () => {
    try {
      const settings = {
        state: {
          model: textModel,
          imageModel,
          videoModel,
          temperature,
          topP,
          ttsModel: '',
        },
        version: 0,
      };
      await chrome.storage.local.set({ 'cinegenie-model-settings': settings });
      toast.success('Model settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = () => {
    setTextModel('gemini-2.5-flash');
    setImageModel('gemini-2.5-flash-image');
    setVideoModel('veo-3.1-fast-generate-preview');
    setTemperature(0.7);
    setTopP(0.95);
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Text Generation Models</CardTitle>
          <CardDescription>Configure AI models for script generation and text enhancement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="text-model">Script Generation Model</Label>
            <Select value={textModel} onValueChange={setTextModel}>
              <SelectTrigger id="text-model">
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
            <p className="text-muted-foreground text-xs">
              Pro model offers better quality but higher cost. Flash is recommended for most use cases.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature: {temperature.toFixed(2)}</Label>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={1}
              step={0.1}
              value={[temperature]}
              onValueChange={values => setTemperature(values[0])}
            />
            <p className="text-muted-foreground text-xs">
              Higher values make output more random, lower values more focused and deterministic
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="top-p">Top P: {topP.toFixed(2)}</Label>
            </div>
            <Slider
              id="top-p"
              min={0}
              max={1}
              step={0.05}
              value={[topP]}
              onValueChange={values => setTopP(values[0])}
            />
            <p className="text-muted-foreground text-xs">
              Controls diversity via nucleus sampling. 1.0 considers all tokens
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image Generation</CardTitle>
          <CardDescription>Configure Imagen model for scene visualization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-model">Imagen Model</Label>
            <Select value={imageModel} onValueChange={setImageModel}>
              <SelectTrigger id="image-model">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video Generation</CardTitle>
          <CardDescription>Configure Veo model for scene animation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-model">Veo Model</Label>
            <Select value={videoModel} onValueChange={setVideoModel}>
              <SelectTrigger id="video-model">
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
            <p className="text-muted-foreground text-xs">Fast model is recommended for preview purposes</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default AIModelsTab;
