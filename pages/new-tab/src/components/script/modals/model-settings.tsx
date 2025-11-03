import { ModelSettings as ModelSettingsForm } from '../settings/model-settings';
import { Button, Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@extension/ui';
import type React from 'react';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ModelSettings: React.FC<ModelSettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const handleSaveClick = () => {
    onSave();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-4xl">
          <DialogTitle>Tùy chọn Model AI</DialogTitle>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tùy chỉnh các model AI được sử dụng để tạo kịch bản.
            </p>
            <ModelSettingsForm />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleSaveClick}>Lưu thay đổi</Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default ModelSettings;
