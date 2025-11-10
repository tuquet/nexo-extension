import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@extension/ui';
import { FileJson } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Scene } from '@src/types';
import type { ReactElement } from 'react';

interface SceneEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Partial<Scene>;
  onSave: (data: Partial<Scene>) => void;
  title: string;
  description?: string;
  onSwitchToJSON?: () => void;
}

const SceneEditor = ({
  open,
  onOpenChange,
  initialData,
  onSave,
  title,
  description,
  onSwitchToJSON,
}: SceneEditorProps): ReactElement => {
  const [formData, setFormData] = useState<Partial<Scene>>({
    time: '',
    location: '',
    action: '',
    visual_style: '',
    audio_style: '',
    dialogues: [],
  });

  useEffect(() => {
    if (open && initialData) {
      setFormData({
        time: initialData.time || '',
        location: initialData.location || '',
        action: initialData.action || '',
        visual_style: initialData.visual_style || '',
        audio_style: initialData.audio_style || '',
        dialogues: initialData.dialogues || [],
      });
    }
  }, [open, initialData]);

  const handleSave = () => {
    if (!formData.location?.trim()) {
      alert('Địa điểm là bắt buộc');
      return;
    }

    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            {onSwitchToJSON && (
              <Button variant="ghost" size="sm" onClick={onSwitchToJSON} className="gap-2">
                <FileJson className="size-4" />
                Switch to JSON Editor
              </Button>
            )}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Địa điểm (Location) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="VD: Phòng khách nhà bà Lan"
            />
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Thời gian (Time)</Label>
            <Input
              id="time"
              value={formData.time || ''}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              placeholder="VD: Buổi sáng, Ban ngày, Đêm khuya"
            />
          </div>

          {/* Action */}
          <div className="space-y-2">
            <Label htmlFor="action">Hành động (Action)</Label>
            <Textarea
              id="action"
              value={formData.action || ''}
              onChange={e => setFormData({ ...formData, action: e.target.value })}
              placeholder="Mô tả hành động và diễn biến trong cảnh này"
              rows={4}
            />
          </div>

          {/* Visual Style */}
          <div className="space-y-2">
            <Label htmlFor="visual_style">Phong cách hình ảnh (Visual Style)</Label>
            <Textarea
              id="visual_style"
              value={formData.visual_style || ''}
              onChange={e => setFormData({ ...formData, visual_style: e.target.value })}
              placeholder="VD: Cinematic lighting, warm tones, close-up shots"
              rows={2}
            />
          </div>

          {/* Audio Style */}
          <div className="space-y-2">
            <Label htmlFor="audio_style">Phong cách âm thanh (Audio Style)</Label>
            <Textarea
              id="audio_style"
              value={formData.audio_style || ''}
              onChange={e => setFormData({ ...formData, audio_style: e.target.value })}
              placeholder="VD: Ambient background music, soft piano"
              rows={2}
            />
          </div>

          <p className="text-muted-foreground text-sm">
            💡 Tip: Hội thoại (dialogues) có thể thêm sau khi tạo cảnh trong giao diện chính
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>Lưu cảnh</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { SceneEditor };
