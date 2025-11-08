import { Button, Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@extension/ui';
import { JsonEditor } from '@src/components/common/json-editor';
import { useState } from 'react';
import type React from 'react';

interface JsonImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonString: string) => void;
}

const JsonImport: React.FC<JsonImportProps> = ({ isOpen, onClose, onImport }) => {
  const [jsonText, setJsonText] = useState('');

  const handleImport = () => {
    onImport(jsonText);
    onClose();
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
            <JsonEditor
              value={jsonText}
              onChange={setJsonText}
              onSubmit={handleImport}
              mode="import"
              placeholder='[{"title": "My Movie", "acts": [...]}]'
              rows={10}
              submitButtonText="Nhập"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={onClose}>Hủy</Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default JsonImport;
