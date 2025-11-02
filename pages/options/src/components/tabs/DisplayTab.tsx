import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  Slider,
  Switch,
  toast,
} from '@extension/ui';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const DisplayTab = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [containerSize, setContainerSize] = useState<'narrow' | 'normal' | 'wide' | 'fluid'>('normal');
  const [compactMode, setCompactMode] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [defaultAspectRatio, setDefaultAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4'>('16:9');

  useEffect(() => {
    // Load preferences from chrome.storage.local (same storage as new-tab usePreferencesStore)
    chrome.storage.local.get(['preferences'], result => {
      const prefs = result.preferences;
      if (prefs?.state) {
        if (prefs.state.theme) setTheme(prefs.state.theme);
        if (prefs.state.containerSize) setContainerSize(prefs.state.containerSize);
        if (prefs.state.compactMode !== undefined) setCompactMode(prefs.state.compactMode);
        if (prefs.state.fontScale !== undefined) setFontScale(prefs.state.fontScale);
        if (prefs.state.defaultAspectRatio) setDefaultAspectRatio(prefs.state.defaultAspectRatio);
      }
    });
  }, []);

  const applyThemeImmediately = (newTheme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    const isDark =
      newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    applyThemeImmediately(newTheme);
    // Auto-save theme immediately for instant feedback
    savePreferences(newTheme);
  };

  const savePreferences = async (themeOverride?: 'light' | 'dark' | 'system') => {
    try {
      const preferences = {
        state: {
          theme: themeOverride || theme,
          containerSize,
          compactMode,
          fontScale,
          defaultAspectRatio,
        },
        version: 1,
      };
      await chrome.storage.local.set({ preferences });

      // Broadcast change event for new-tab page to update
      chrome.runtime
        .sendMessage({
          type: 'PREFERENCES_UPDATED',
          payload: preferences,
        })
        .catch(() => {
          // Ignore if no listener (new-tab page not open)
        });

      toast.success('Display settings saved successfully', {
        description: 'Changes applied to all extension pages',
      });
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleSave = () => {
    savePreferences();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={theme} onValueChange={(v: string) => handleThemeChange(v as 'light' | 'dark' | 'system')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2">
                <Sun className="size-4" />
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2">
                <Moon className="size-4" />
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2">
                <Monitor className="size-4" />
                System
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Layout & Spacing</CardTitle>
          <CardDescription>Customize layout and content width</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Container Size</Label>
            <RadioGroup
              value={containerSize}
              onValueChange={(v: string) => setContainerSize(v as 'narrow' | 'normal' | 'wide' | 'fluid')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="narrow" id="narrow" />
                <Label htmlFor="narrow">Narrow (900px)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal">Normal (1200px)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wide" id="wide" />
                <Label htmlFor="wide">Wide (1600px)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fluid" id="fluid" />
                <Label htmlFor="fluid">Fluid (100%)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compact-mode">Compact Mode</Label>
              <p className="text-muted-foreground text-xs">Reduce spacing between elements</p>
            </div>
            <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-scale">Font Scale: {fontScale.toFixed(1)}x</Label>
            </div>
            <Slider
              id="font-scale"
              min={0.8}
              max={1.5}
              step={0.1}
              value={[fontScale]}
              onValueChange={values => setFontScale(values[0])}
            />
            <p className="text-muted-foreground text-xs">Adjust text size across the application</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default DisplayTab;
