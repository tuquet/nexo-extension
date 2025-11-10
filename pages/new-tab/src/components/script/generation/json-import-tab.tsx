import { JsonEditor } from '@src/components/common/json-editor';
import { useState } from 'react';

interface JsonImportTabProps {
  isLoading: boolean;
  onImportJson: (jsonString: string) => void;
  onImportFile?: (event: React.ChangeEvent<HTMLInputElement>) => void; // Make optional, deprecated
}

const JsonImportTab: React.FC<JsonImportTabProps> = ({ isLoading, onImportJson }) => {
  const [jsonText, setJsonText] = useState('');

  const handleSubmit = (parsed: unknown) => {
    // JsonEditor returns parsed object, but onImportJson needs string
    // So we stringify it back
    onImportJson(JSON.stringify(parsed));
  };

  const handleFileUpload = async (file: File) => {
    // Read file content and parse JSON
    try {
      const text = await file.text();
      JSON.parse(text); // Validate JSON
      setJsonText(text);
      onImportJson(text);
    } catch (error) {
      console.error('Failed to read/parse JSON file:', error);
    }
  };

  return (
    <JsonEditor
      value={jsonText}
      onChange={setJsonText}
      onSubmit={handleSubmit}
      mode="import"
      placeholder='[{"title": "My Movie", "acts": [...]}]'
      rows={20}
      disabled={isLoading}
      label="Nội dung JSON kịch bản"
      submitButtonText={isLoading ? 'Đang nhập...' : 'Nhập từ văn bản'}
      fileUploadButtonText="Nhập từ File"
      showFileUpload
      onFileUpload={handleFileUpload}
    />
  );
};

export { JsonImportTab };
