import { Button, Label, Textarea } from '@extension/ui';
import { useRef, useState } from 'react';

interface JsonImportTabProps {
  isLoading: boolean;
  onImportJson: (jsonString: string) => void;
  onImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const JsonImportTab: React.FC<JsonImportTabProps> = ({ isLoading, onImportJson, onImportFile }) => {
  const importFileRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImportClick = () => {
    setError(null);
    if (!jsonText.trim()) {
      setError('Vui lòng dán nội dung JSON vào ô bên dưới.');
      return;
    }
    try {
      JSON.parse(jsonText);
      onImportJson(jsonText);
    } catch {
      setError('Nội dung JSON không hợp lệ. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="json-input">Nội dung JSON kịch bản</Label>
        <Textarea
          id="json-input"
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          placeholder='[{"title": "My Movie", "acts": [...]}]'
          rows={20}
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleImportClick} className="flex-1" disabled={isLoading}>
          {isLoading ? 'Đang nhập...' : 'Nhập từ văn bản'}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => importFileRef.current?.click()}
          disabled={isLoading}>
          Nhập từ File
        </Button>
        <input type="file" ref={importFileRef} className="hidden" accept=".json" multiple onChange={onImportFile} />
      </div>
    </div>
  );
};
