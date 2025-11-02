import { Input, Button, Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from '@extension/ui';
import { useApiKey } from '@src/stores/use-api-key';
import { useState, useEffect } from 'react';
import type React from 'react';

interface AppSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScriptSettingModal: React.FC<AppSettingModalProps> = ({ isOpen, onClose }) => {
  const { apiKey, setApiKey } = useApiKey();
  const [localKey, setLocalKey] = useState(apiKey || '');

  useEffect(() => {
    setLocalKey(apiKey || '');
  }, [apiKey, isOpen]);

  const handleSave = () => {
    setApiKey(localKey);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Cài đặt ứng dụng</DialogTitle>
          <div>
            <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Vui lòng nhập khóa API Gemini của bạn. Khóa của bạn sẽ được lưu trữ an toàn trong trình duyệt của bạn.
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary ml-1 hover:underline">
                Lấy khóa API tại đây
              </a>
              .
            </p>
            <Input
              type="password"
              value={localKey}
              onChange={e => setLocalKey(e.target.value)}
              placeholder="Dán khóa API của bạn vào đây"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={onClose}>Hủy</Button>
            <Button onClick={handleSave}>Lưu Khóa API</Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default ScriptSettingModal;
