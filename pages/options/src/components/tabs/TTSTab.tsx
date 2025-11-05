import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Label, Slider, toast } from '@extension/ui';
import { useEffect, useState } from 'react';

const TTSTab = () => {
  const [narratorVoice, setNarratorVoice] = useState('n_hanoi_male_baotrungreviewphim_review_vc');
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(100);

  useEffect(() => {
    chrome.storage.local.get(['cinegenie-model-settings'], result => {
      const settings = result['cinegenie-model-settings'];
      if (settings?.state?.ttsModel) {
        setNarratorVoice(settings.state.ttsModel);
      }
    });
  }, []);

  const handleSave = async () => {
    try {
      const existingSettings = await chrome.storage.local.get(['cinegenie-model-settings']);
      const settings = {
        ...existingSettings['cinegenie-model-settings'],
        state: {
          ...existingSettings['cinegenie-model-settings']?.state,
          ttsModel: narratorVoice,
        },
      };
      await chrome.storage.local.set({ 'cinegenie-model-settings': settings });
      toast.success('TTS settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default TTS Settings</CardTitle>
          <CardDescription>Configure voice and audio parameters for text-to-speech</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="speaking-rate">Speaking Rate: {speakingRate.toFixed(1)}x</Label>
            </div>
            <Slider
              id="speaking-rate"
              min={0.5}
              max={2}
              step={0.1}
              value={[speakingRate]}
              onValueChange={values => setSpeakingRate(values[0])}
            />
            <p className="text-muted-foreground text-xs">Adjust speech speed (1.0 is normal)</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pitch">Pitch: {pitch > 0 ? `+${pitch}` : pitch}</Label>
            </div>
            <Slider
              id="pitch"
              min={-10}
              max={10}
              step={1}
              value={[pitch]}
              onValueChange={values => setPitch(values[0])}
            />
            <p className="text-muted-foreground text-xs">Adjust voice pitch (0 is default)</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="volume">Volume: {volume}%</Label>
            </div>
            <Slider
              id="volume"
              min={0}
              max={100}
              step={5}
              value={[volume]}
              onValueChange={values => setVolume(values[0])}
            />
            <p className="text-muted-foreground text-xs">Output volume level</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voice Mapping Presets</CardTitle>
          <CardDescription>Set default voices for character types</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Voice mapping presets will be available in a future update</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default TTSTab;
