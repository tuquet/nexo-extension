import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  toast,
} from '@extension/ui';
import { Database, Download, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const AdvancedTab = () => {
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit] = useState(100); // MB
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    calculateStorageUsage();
  }, []);

  const calculateStorageUsage = async () => {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage || 0) / (1024 * 1024);
        setStorageUsed(Math.round(usedMB * 10) / 10);
      }
    } catch (error) {
      console.error('Failed to calculate storage:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await chrome.storage.local.get(null);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extension-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: Event) => {
      try {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;
        const text = await file.text();
        const data = JSON.parse(text);
        await chrome.storage.local.set(data);
        toast.success('Data imported successfully. Please reload the extension.');
      } catch {
        toast.error('Failed to import data');
      }
    };
    input.click();
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      await calculateStorageUsage();
      toast.success('Cache cleared successfully');
    } catch {
      toast.error('Failed to clear cache');
    }
  };

  const handleResetSettings = async () => {
    try {
      await chrome.storage.local.clear();
      toast.success('All settings reset successfully');
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error('Failed to reset settings');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export, import, and manage your extension data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Storage Used</span>
              <span className="text-sm font-medium">
                {storageUsed} MB / {storageLimit} MB
              </span>
            </div>
            <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 size-4" />
              Export All Data
            </Button>
            <Button onClick={handleImportData} variant="outline">
              <Database className="mr-2 size-4" />
              Import Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache & Performance</CardTitle>
          <CardDescription>Manage cached data and performance settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleClearCache} variant="outline" className="w-full">
            <RefreshCw className="mr-2 size-4" />
            Clear Cache
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Developer Options</CardTitle>
          <CardDescription>Advanced settings for debugging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="debug-mode">Debug Mode</Label>
              <p className="text-muted-foreground">Enable console logging and debug info</p>
            </div>
            <Switch id="debug-mode" checked={debugMode} onCheckedChange={setDebugMode} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions that affect all your data</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 size-4" />
                Reset All Settings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all settings, scripts, and cached data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetSettings} className="bg-destructive text-destructive-foreground">
                  Yes, reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedTab;
