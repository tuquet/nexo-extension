import AdvancedModelOptions from './advanced-model-options';
import { Button, Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from '@extension/ui';
import { IMAGE_GENERATION_MODEL, SCRIPT_GENERATION_MODEL, VIDEO_GENERATION_MODEL } from '@src/constants';
import { useState, useEffect } from 'react';
import type { Root } from '@src/types';
import type React from 'react';

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: Root;
  onSave: (newSettings: { imageModel: string; videoModel: string }) => void;
}

const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({ isOpen, onClose, script, onSave }) => {
  const [imageModel, setImageModel] = useState(script.setting.defaultImageModel || IMAGE_GENERATION_MODEL);
  const [videoModel, setVideoModel] = useState(script.setting.defaultVideoModel || VIDEO_GENERATION_MODEL);

  // Reset state when modal opens with a new script
  useEffect(() => {
    if (isOpen) {
      setImageModel(script.setting.defaultImageModel || IMAGE_GENERATION_MODEL);
      setVideoModel(script.setting.defaultVideoModel || VIDEO_GENERATION_MODEL);
    }
  }, [isOpen, script]);

  const handleSaveClick = () => {
    onSave({ imageModel, videoModel });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Tùy chọn Model AI</DialogTitle>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Tùy chỉnh các model AI được sử dụng để tạo tài sản cho kịch bản này.
            </p>
            {/* Chỉ hiển thị các tùy chọn liên quan đến tài sản */}
            <AdvancedModelOptions
              scriptModel={SCRIPT_GENERATION_MODEL} // Giữ giá trị mặc định, không cho sửa
              onScriptModelChange={() => {}}
              suggestionModel={SCRIPT_GENERATION_MODEL} // Giữ giá trị mặc định, không cho sửa
              onSuggestionModelChange={() => {}}
              imageModel={imageModel}
              onImageModelChange={setImageModel}
              videoModel={videoModel}
              onVideoModelChange={setVideoModel}
            />
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

export default ModelSettingsModal;
