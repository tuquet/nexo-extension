/**
 * Scene Form Component - Uses Generic DualModeEditor
 * Create/edit scenes using JSON textarea OR visual UI editor (SceneEditor)
 */

import { DualModeEditor } from '@src/components/common/dual-mode-editor';
import { SceneEditor } from '@src/components/script/forms/scene-editor';
import { DEFAULT_SCENE_TEMPLATE } from '@src/constants/scene-defaults';
import { validateSceneJSON } from '@src/utils/scene-validation';
import type { Scene } from '@src/types';

interface SceneFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SceneFormData) => void;
  initialData?: Partial<Scene>;
  mode: 'create' | 'edit';
}

interface SceneFormData extends Record<string, unknown> {
  scene_number: number;
  time: string;
  location: string;
  action: string;
  visual_style: string;
  audio_style: string;
  dialogues: Scene['dialogues'];
  actIndex?: number;
  sceneIndex?: number;
}

const SceneForm = ({ open, onOpenChange, onSubmit, initialData, mode }: SceneFormProps) => (
  <DualModeEditor<SceneFormData>
    open={open}
    onOpenChange={onOpenChange}
    onSubmit={onSubmit}
    initialData={initialData as unknown as SceneFormData}
    defaultTemplate={
      {
        scene_number: 1,
        ...DEFAULT_SCENE_TEMPLATE,
      } as SceneFormData
    }
    mode={mode}
    validateJSON={validateSceneJSON}
    renderUIEditor={({
      open: uiOpen,
      onOpenChange: uiOnOpenChange,
      data,
      onSave,
      title,
      description,
      onSwitchToJSON,
    }) => (
      <SceneEditor
        open={uiOpen}
        onOpenChange={uiOnOpenChange}
        initialData={data as unknown as Partial<Scene>}
        onSave={onSave}
        title={title}
        description={description}
        onSwitchToJSON={onSwitchToJSON}
      />
    )}
    title={{
      create: 'Tạo cảnh mới',
      edit: 'Chỉnh sửa cảnh',
      createJSON: 'Tạo cảnh mới (JSON)',
      editJSON: 'Chỉnh sửa cảnh (JSON)',
    }}
    description={{
      ui: 'Sử dụng biểu mẫu bên dưới để cấu hình cảnh. Chuyển sang chế độ JSON để chỉnh sửa nâng cao.',
      json: 'Chỉnh sửa đối tượng JSON ở trên.',
    }}
    fieldsToExclude={['generatedImageId', 'generatedVideoId']}
    helpText={{
      requiredFields: 'Trường bắt buộc: location, time, action, visual_style, audio_style, dialogues.',
      validationRules: 'Dialogues phải là array với roleId (camelCase) và line (string).',
    }}
  />
);

export { SceneForm };
export type { SceneFormData };
