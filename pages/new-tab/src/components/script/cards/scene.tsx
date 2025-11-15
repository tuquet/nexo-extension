import EditableField from '../ui/editable-field';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardAction, CardTitle, CardContent, CardFooter, Button, Badge, toast } from '@extension/ui';
import { db } from '@src/db';
import { useAudioPlayerStore } from '@src/stores/use-audio-player-store';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import {
  MapPin,
  Clock,
  Users,
  Clapperboard,
  MessageSquare,
  Cloud,
  Camera,
  Copy,
  PlayCircle,
  PauseCircle,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Scene } from '@src/types';
import type React from 'react';

interface SceneCardProps {
  scene: Scene;
  language: 'en-US' | 'vi-VN';
  actIndex: number;
  sceneIndex: number;
  onAddScene?: (actIndex: number) => void;
}

/**
 * Veo 3.1 Prompt Section Component
 * Displays one section of the 6-element structure for video generation
 */
const PromptSection: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  onSave: (value: string) => void;
  context: string;
  language: 'en-US' | 'vi-VN';
  placeholder?: string;
}> = ({ icon, label, value, onSave, context, language, placeholder }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
      <span className="text-slate-500 dark:text-slate-400">{icon}</span>
      <span>{label}</span>
    </div>
    <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <EditableField
        initialValue={value || placeholder || ''}
        onSave={onSave}
        context={context}
        language={language}
        textClassName="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed"
      />
    </div>
  </div>
);

/**
 * Sortable Dialogue Item Component
 * Individual dialogue item with drag handle
 */
interface SortableDialogueProps {
  dialogue: Scene['dialogues'][0];
  index: number;
  actIndex: number;
  sceneIndex: number;
  language: 'en-US' | 'vi-VN';
  editingDialogueRoleId: { index: number; roleId: string } | null;
  setEditingDialogueRoleId: (value: { index: number; roleId: string } | null) => void;
  handlePlayDialogue: (dialogue: Scene['dialogues'][0]) => void;
  playingSource: string | null;
  isPlaying: boolean;
  isLoading: boolean;
}

const SortableDialogue: React.FC<SortableDialogueProps> = ({
  dialogue,
  index,
  actIndex,
  sceneIndex,
  language,
  editingDialogueRoleId,
  setEditingDialogueRoleId,
  handlePlayDialogue,
  playingSource,
  isPlaying,
  isLoading,
}) => {
  const updateDialogueLine = useScriptsStore(s => s.updateDialogueLine);
  const updateDialogueRoleId = useScriptsStore(s => s.updateDialogueRoleId);
  const deleteDialogue = useScriptsStore(s => s.deleteDialogue);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: index,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-slate-400 hover:text-slate-600 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400">
            <GripVertical className="size-4" />
          </button>
          {editingDialogueRoleId?.index === index ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editingDialogueRoleId.roleId}
                onChange={e =>
                  setEditingDialogueRoleId({
                    index,
                    roleId: e.target.value,
                  })
                }
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    updateDialogueRoleId(actIndex, sceneIndex, index, editingDialogueRoleId.roleId);
                    setEditingDialogueRoleId(null);
                  } else if (e.key === 'Escape') {
                    setEditingDialogueRoleId(null);
                  }
                }}
                className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  updateDialogueRoleId(actIndex, sceneIndex, index, editingDialogueRoleId.roleId);
                  setEditingDialogueRoleId(null);
                }}>
                Lưu
              </Button>
            </div>
          ) : (
            <>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{dialogue.roleId}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setEditingDialogueRoleId({
                    index,
                    roleId: dialogue.roleId,
                  })
                }
                className="size-6 p-0">
                <Pencil className="size-3" />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {dialogue.generatedAudioId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlayDialogue(dialogue)}
              disabled={dialogue.isGeneratingAudio}
              className="gap-2">
              {dialogue.isGeneratingAudio ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isLoading && playingSource?.includes(dialogue.generatedAudioId.toString()) ? (
                <Loader2 className="size-4 animate-spin text-blue-500" />
              ) : isPlaying && playingSource?.includes(dialogue.generatedAudioId.toString()) ? (
                <>
                  <PauseCircle className="size-4 text-blue-500" />
                  Pause
                </>
              ) : (
                <>
                  <PlayCircle className="size-4" />
                  Play
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (confirm(`Xóa hội thoại của ${dialogue.roleId}?`)) {
                await deleteDialogue(actIndex, sceneIndex, index);
                toast.success('Đã xóa hội thoại');
              }
            }}
            className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
      <EditableField
        initialValue={dialogue.line}
        onSave={v => updateDialogueLine(actIndex, sceneIndex, index, v)}
        context={`Dialogue for ${dialogue.roleId}`}
        language={language}
        textClassName="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed"
      />
    </div>
  );
};

const Scene: React.FC<SceneCardProps> = ({ scene, language, actIndex, sceneIndex, onAddScene }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editingDialogueRoleId, setEditingDialogueRoleId] = useState<{ index: number; roleId: string } | null>(null);
  const { playingSource, isPlaying, isLoading, togglePlay } = useAudioPlayerStore();
  const updateSceneField = useScriptsStore(s => s.updateSceneField);
  const addDialogue = useScriptsStore(s => s.addDialogue);
  const mergeDialoguesInScene = useScriptsStore(s => s.mergeDialoguesInScene);
  const reorderDialogues = useScriptsStore(s => s.reorderDialogues);
  const deleteScene = useScriptsStore(s => s.deleteScene);
  const activeScript = useScriptsStore(s => s.activeScript);

  // Drag and drop sensors
  // NOTE: KeyboardSensor is DISABLED to prevent intercepting Enter/Arrow keys
  // in EditableField textarea/input. Users can still drag using mouse/touch.
  // If keyboard dragging is needed, implement custom activation logic that
  // checks if active element is an input/textarea before activating.
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = scene.dialogues.findIndex((_, i) => i === active.id);
      const newIndex = scene.dialogues.findIndex((_, i) => i === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderDialogues(actIndex, sceneIndex, oldIndex, newIndex);
      }
    }
  };

  useEffect(() => {
    let objectUrl: string | null = null;
    const loadImage = async () => {
      if (scene.generatedImageId) {
        try {
          const imageRecord = await db.images.get(scene.generatedImageId);
          if (imageRecord?.data) {
            objectUrl = URL.createObjectURL(imageRecord.data);
            setImageUrl(objectUrl);
          } else {
            setImageUrl(null);
          }
        } catch (error) {
          console.error('Error loading image from DB:', error);
          setImageUrl(null);
        }
      } else {
        setImageUrl(null);
      }
    };
    loadImage();
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [scene.generatedImageId]);

  const handlePlayDialogue = async (dialogue: Scene['dialogues'][0]) => {
    const audioId = dialogue.generatedAudioId;
    if (!audioId) return;

    if (playingSource?.startsWith(`blob:`) && playingSource.includes(audioId.toString())) {
      togglePlay(playingSource);
      return;
    }

    try {
      useAudioPlayerStore.getState().setLoading(true);
      const audioRecord = await db.audios.get(audioId);
      if (audioRecord?.data) {
        const objectUrl = URL.createObjectURL(audioRecord.data);
        const urlWithId = `${objectUrl}#${audioId}`;
        togglePlay(urlWithId);
      } else {
        throw new Error('Audio record not found in DB.');
      }
    } catch (error) {
      console.error('Error playing audio from DB:', error);
    }
  };

  // Generate Veo 3.1 prompt from scene data
  const generateVeoPrompt = (): string => {
    const characters = activeScript?.characters || [];
    const sceneCharacters = scene.dialogues.map(d => d.roleId).filter((v, i, a) => a.indexOf(v) === i);
    const characterDescriptions = sceneCharacters
      .map(roleId => {
        const char = characters.find(c => c.roleId === roleId);
        return char ? `${char.name} (${char.description})` : roleId;
      })
      .join(', ');

    const dialogueText =
      scene.dialogues.length > 0
        ? scene.dialogues
            .reduce<string[]>((acc, currentDialogue, index, array) => {
              // Lấy roleId của đoạn hội thoại trước đó
              const previousRoleId = index > 0 ? array[index - 1].roleId : null;

              // Xây dựng chuỗi dòng hiện tại: KHÔNG CÓ DẤU NHÁY KÉP
              const currentLine = currentDialogue.line;

              if (currentDialogue.roleId === previousRoleId) {
                // Nếu roleId giống nhau, thêm dòng hiện tại vào dòng cuối cùng của acc, phân tách bằng '\n'
                acc[acc.length - 1] += `\n${currentLine}`;
              } else {
                // Nếu là roleId mới, tạo mục mới với tiêu đề roleId: và dòng hiện tại
                acc.push(`${currentDialogue.roleId}:\n${currentLine}`);
              }

              return acc;
            }, [])
            .join('\n\n') // Dùng \n\n để phân tách rõ ràng giữa các nhóm roleId khác nhau
        : 'Không có hội thoại';
    return `🎬 Scene ${scene.scene_number}

📍 Bối cảnh (Context):
${scene.location} - ${scene.time}

👥 Nhân vật (Character):
${characterDescriptions || 'Không có nhân vật'}

🎭 Hành động (Action):
${scene.action}

🌤️ Hiệu ứng Môi trường (Environmental Effects):
${scene.audio_style}

🎥 Phong cách Điện ảnh/Chất lượng (Cinematic Style):
${scene.visual_style}

💬 Hội thoại/Âm thanh (Dialogue/Sound):
${dialogueText}
`;
  };

  const handleCopyPrompt = () => {
    const prompt = generateVeoPrompt();
    navigator.clipboard.writeText(prompt).then(
      () => {
        toast.success('Đã copy prompt Veo 3.1!');
      },
      err => {
        console.error('Failed to copy:', err);
        toast.error('Không thể copy prompt');
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clapperboard className="size-5" />
            CẢNH {scene.scene_number}
          </span>
        </CardTitle>
        <CardAction>
          {scene.generatedImageId && (
            <Badge variant="secondary" className="gap-1">
              <Camera className="size-3" />
              Ảnh
            </Badge>
          )}
          {scene.generatedVideoId && (
            <Badge variant="secondary" className="gap-1">
              📹 Video
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleCopyPrompt} className="gap-2" title="Sao chép văn bản">
            <Copy className="size-4" />
          </Button>
          <Button
            title="Xóa Cảnh"
            size="sm"
            variant="ghost"
            onClick={async () => {
              const act = activeScript?.acts[actIndex];
              if (!act || act.scenes.length <= 1) {
                toast.error('Không thể xóa', { description: 'Phải có ít nhất 1 cảnh trong mỗi hồi' });
                return;
              }
              if (confirm(`Xóa CẢNH ${scene.scene_number}?`)) {
                await deleteScene(actIndex, sceneIndex);
                toast.success('Đã xóa cảnh');
              }
            }}
            className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950">
            <Trash2 className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {/* Generated Image Display */}
        {imageUrl && (
          <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <img src={imageUrl} alt={`Scene ${scene.scene_number}`} className="h-full w-full object-cover" />
          </div>
        )}

        {/* Veo 3.1 Structured Prompt Layout */}
        <div className="space-y-5">
          {/* 1. Context (Bối cảnh) */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <MapPin className="size-4" />
              📍 Bối cảnh (Context)
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              <PromptSection
                icon={<MapPin className="size-4" />}
                label="Địa điểm"
                value={scene.location}
                onSave={v => updateSceneField(actIndex, sceneIndex, 'location', v)}
                context="Scene Location"
                language={language}
                placeholder="Vd: Phòng khách rộng rãi, hiện đại"
              />
              <PromptSection
                icon={<Clock className="size-4" />}
                label="Thời gian"
                value={scene.time}
                onSave={v => updateSceneField(actIndex, sceneIndex, 'time', v)}
                context="Scene Time"
                language={language}
                placeholder="Vd: Ban ngày, ánh sáng mặt trời"
              />
            </div>
          </div>

          {/* 2. Character (Nhân vật) */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Users className="size-4" />
              👥 Nhân vật (Character)
            </h4>
            <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {scene.dialogues.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {scene.dialogues
                      .map(d => d.roleId)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map(roleId => {
                        const character = activeScript?.characters.find(c => c.roleId === roleId);
                        return (
                          <Badge key={roleId} variant="outline" className="gap-1">
                            <Users className="size-3" />
                            {character ? `[${character.roleId}] ${character.name} (${character.description})` : roleId}
                          </Badge>
                        );
                      })}
                  </div>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">Chưa có nhân vật trong cảnh này</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Action (Hành động) */}
          <PromptSection
            icon={<Clapperboard className="size-5" />}
            label="🎭 Hành động (Action)"
            value={scene.action}
            onSave={v => updateSceneField(actIndex, sceneIndex, 'action', v)}
            context="Scene Action"
            language={language}
            placeholder="Mô tả chi tiết hành động diễn ra trong cảnh"
          />

          {/* 4. Environmental Effects (Hiệu ứng Môi trường) */}
          <PromptSection
            icon={<Cloud className="size-5" />}
            label="🌤️ Hiệu ứng Môi trường (Environmental Effects)"
            value={scene.audio_style}
            onSave={v => updateSceneField(actIndex, sceneIndex, 'audio_style', v)}
            context="Environmental Effects & Audio Style"
            language={language}
            placeholder="Vd: Tiếng gió nhẹ, âm thanh chim hót, nhạc nền du dương"
          />

          {/* 5. Cinematic Style (Phong cách Điện ảnh) */}
          <PromptSection
            icon={<Camera className="size-5" />}
            label="🎥 Phong cách Điện ảnh/Chất lượng (Cinematic Style)"
            value={scene.visual_style}
            onSave={v => updateSceneField(actIndex, sceneIndex, 'visual_style', v)}
            context="Cinematic Style & Visual Quality"
            language={language}
            placeholder="Vd: Close-up, chuyển động camera mượt mà, ánh sáng tự nhiên, 4K, cinematic"
          />

          {/* 6. Dialogue/Sound (Hội thoại/Âm thanh) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <MessageSquare className="size-4" />
                💬 Hội thoại/Âm thanh (Dialogue/Sound)
              </h4>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => addDialogue(actIndex, sceneIndex, 'Narrator')}>
                  <Plus className="size-4" />
                  Thêm hội thoại
                </Button>
                <Button size="sm" variant="outline" onClick={() => mergeDialoguesInScene(actIndex, sceneIndex)}>
                  Gộp hội thoại
                </Button>
              </div>
            </div>
            {scene.dialogues.length > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={scene.dialogues.map((_, i) => i)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {scene.dialogues.map((dialogue, index) => (
                      <SortableDialogue
                        key={index}
                        dialogue={dialogue}
                        index={index}
                        actIndex={actIndex}
                        sceneIndex={sceneIndex}
                        language={language}
                        editingDialogueRoleId={editingDialogueRoleId}
                        setEditingDialogueRoleId={setEditingDialogueRoleId}
                        handlePlayDialogue={handlePlayDialogue}
                        playingSource={playingSource}
                        isPlaying={isPlaying}
                        isLoading={isLoading}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                Không có hội thoại
              </div>
            )}
          </div>
        </div>
      </CardContent>
      {onAddScene && (
        <CardFooter className="flex justify-center border-t pt-4">
          <Button size="sm" variant="outline" onClick={() => onAddScene(actIndex)} className="gap-2">
            <Plus className="size-4" />
            Thêm Cảnh Mới
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default Scene;
