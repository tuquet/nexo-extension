import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  toast,
} from '@extension/ui';
import { CheckCircle2, ExternalLink, Eye, EyeOff, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const GeneralTab = () => {
  const [apiKey, setApiKey] = useState('');
  const [vbeeToken, setVbeeToken] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showVbeeToken, setShowVbeeToken] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');

  useEffect(() => {
    // Load existing keys and status from chrome.storage
    chrome.storage.local.get(['app_settings', 'apiKeyStatus', 'apiKeyStatusTimestamp'], result => {
      // Load API keys from app_settings structure
      if (result.app_settings?.apiKeys?.gemini) {
        setApiKey(result.app_settings.apiKeys.gemini);
      }
      if (result.app_settings?.apiKeys?.vbee) {
        setVbeeToken(result.app_settings.apiKeys.vbee);
      }

      // Restore API key status if cached and not expired (5 minutes)
      if (result.apiKeyStatus && result.apiKeyStatusTimestamp) {
        const age = Date.now() - result.apiKeyStatusTimestamp;
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        if (age < CACHE_TTL && result.apiKeyStatus === 'connected') {
          setApiKeyStatus('connected');
        }
      }
    });

    // Listen for real-time Vbee token capture from background
    const handleMessage = (message: { type: string; token?: string }) => {
      if (message.type === 'VBEE_TOKEN_CAPTURED' && message.token) {
        setVbeeToken(message.token);
        toast.success('Vbee token captured automatically!', {
          description: 'Token has been saved from studio.vbee.vn',
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    // Cleanup listener on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleSaveApiKey = async () => {
    try {
      // Save to app_settings structure
      const result = await chrome.storage.local.get('app_settings');
      const appSettings = result.app_settings || {};
      const updatedSettings = {
        ...appSettings,
        apiKeys: {
          ...(appSettings.apiKeys || {}),
          gemini: apiKey,
          vbee: appSettings.apiKeys?.vbee || '',
        },
      };
      await chrome.storage.local.set({ app_settings: updatedSettings });
      toast.success('API key đã được lưu thành công');
    } catch {
      toast.error('Không thể lưu API key');
    }
  };

  const handleSaveVbeeToken = async () => {
    try {
      // Save to app_settings structure
      const result = await chrome.storage.local.get('app_settings');
      const appSettings = result.app_settings || {};
      const updatedSettings = {
        ...appSettings,
        apiKeys: {
          ...(appSettings.apiKeys || {}),
          gemini: appSettings.apiKeys?.gemini || '',
          vbee: vbeeToken,
        },
      };
      await chrome.storage.local.set({ app_settings: updatedSettings });
      toast.success('Vbee token đã được lưu thành công');
    } catch {
      toast.error('Không thể lưu Vbee token');
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key first');
      return;
    }

    setApiKeyStatus('testing');

    try {
      // Send test message to background service worker
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_GEMINI_CONNECTION',
        payload: { apiKey },
      });

      if (response?.success) {
        setApiKeyStatus('connected');
        // Cache the successful status with timestamp
        await chrome.storage.local.set({
          apiKeyStatus: 'connected',
          apiKeyStatusTimestamp: Date.now(),
        });
        toast.success('Connection successful', {
          description: 'Google AI API is working correctly',
        });
      } else {
        setApiKeyStatus('disconnected');
        await chrome.storage.local.set({ apiKeyStatus: 'disconnected' });
        toast.error('Connection failed', {
          description: response?.error?.message || 'Invalid API key or network error',
        });
      }
    } catch (error) {
      setApiKeyStatus('disconnected');
      await chrome.storage.local.set({ apiKeyStatus: 'disconnected' });
      toast.error('Connection test failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const handleOpenVbeeStudio = () => {
    chrome.tabs.create({ url: 'https://studio.vbee.vn' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google AI API Configuration</CardTitle>
          <CardDescription>Configure your Google AI API key for Gemini, Imagen, and Veo models</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Enter your Google AI API key"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2">
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button onClick={handleSaveApiKey} variant="outline">
                Save
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleTestConnection} disabled={!apiKey || apiKeyStatus === 'testing'}>
              {apiKeyStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Status:</span>
              <Badge variant={apiKeyStatus === 'connected' ? 'default' : 'secondary'}>
                {apiKeyStatus === 'connected' ? (
                  <CheckCircle2 className="mr-1 size-3" />
                ) : (
                  <XCircle className="mr-1 size-3" />
                )}
                {apiKeyStatus === 'connected' ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline">
              Google AI Studio
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vbee TTS Configuration</CardTitle>
          <CardDescription>Configure your Vbee token for Text-to-Speech features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vbee-token">Vbee Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="vbee-token"
                  type={showVbeeToken ? 'text' : 'password'}
                  value={vbeeToken}
                  onChange={e => setVbeeToken(e.target.value)}
                  placeholder="Enter your Vbee token"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowVbeeToken(!showVbeeToken)}
                  className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2">
                  {showVbeeToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button onClick={handleSaveVbeeToken} variant="outline">
                Save
              </Button>
            </div>
          </div>

          <Button onClick={handleOpenVbeeStudio} variant="outline" className="w-full">
            <ExternalLink className="mr-2 size-4" />
            Open Vbee Studio
          </Button>

          <p className="text-muted-foreground text-xs">
            The token will be automatically captured when you log in to studio.vbee.vn
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Info</CardTitle>
          <CardDescription>Extension version and system information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Version</span>
            <span className="text-sm font-medium">0.5.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Extension ID</span>
            <span className="font-mono text-sm">{chrome.runtime.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralTab;
