import { Button, Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, Textarea } from '@extension/ui';
import { useState } from 'react';
import type React from 'react';

interface JsonImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonString: string) => void;
}

const JsonImport: React.FC<JsonImportProps> = ({ isOpen, onClose, onImport }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImportClick = () => {
    setError(null);
    if (!jsonText.trim()) {
      setError('Vui lòng dán nội dung JSON vào ô bên dưới.');
      return;
    }
    try {
      // Thử parse để kiểm tra JSON hợp lệ trước khi gửi đi
      JSON.parse(jsonText);
      onImport(jsonText);
      onClose(); // Đóng modal sau khi gửi đi
    } catch {
      setError('Nội dung JSON không hợp lệ. Vui lòng kiểm tra lại.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Nhập kịch bản từ văn bản JSON</DialogTitle>
          <div>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Dán nội dung của một hoặc nhiều kịch bản dưới định dạng JSON vào ô bên dưới.
            </p>
            <Textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              placeholder='[{"title": "My Movie", "acts": [...]}]'
              rows={10}
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={onClose}>Hủy</Button>
            <Button onClick={handleImportClick}>Nhập</Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default JsonImport;
