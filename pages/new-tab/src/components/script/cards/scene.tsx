import EditableField from '../ui/editable-field';
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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Scene } from '@src/types';
import type React from 'react';

interface SceneCardProps {
  scene: Scene;
  language: 'en-US' | 'vi-VN';
  actIndex: number;
  sceneIndex: number;
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

const Scene: React.FC<SceneCardProps> = ({ scene, language, actIndex, sceneIndex }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { playingSource, isPlaying, isLoading, togglePlay } = useAudioPlayerStore();
  const updateSceneField = useScriptsStore(s => s.updateSceneField);
  const updateDialogueLine = useScriptsStore(s => s.updateDialogueLine);
  const activeScript = useScriptsStore(s => s.activeScript);

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
        ? scene.dialogues.map(d => `${d.roleId}: "${d.line}"`).join('\n')
        : 'Không có hội thoại';

    return `🎬 Scene ${scene.scene_number}

📍 Bối cảnh (Context):
${scene.location} - ${scene.time}

👥 Nhân vật (Character):
${characterDescriptions || 'Không có nhân vật'}

🎭 Hành động (Action):
${scene.action}

💬 Hội thoại/Âm thanh (Dialogue/Sound):
${dialogueText}

🌤️ Hiệu ứng Môi trường (Environmental Effects):
${scene.audio_style}

🎥 Phong cách Điện ảnh/Chất lượng (Cinematic Style):
${scene.visual_style}`;
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
          <Button variant="outline" size="sm" onClick={handleCopyPrompt} className="gap-2">
            <Copy className="size-4" />
            Copy Veo 3.1 Prompt
          </Button>
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
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                            {character ? `${character.name} (${character.description})` : roleId}
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

          {/* 4. Dialogue/Sound (Hội thoại/Âm thanh) */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <MessageSquare className="size-4" />
              💬 Hội thoại/Âm thanh (Dialogue/Sound)
            </h4>
            {scene.dialogues.length > 0 ? (
              <div className="space-y-3">
                {scene.dialogues.map((dialogue, index) => (
                  <div
                    key={index}
                    className="rounded-md border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{dialogue.roleId}</span>
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
                    </div>
                    <EditableField
                      initialValue={dialogue.line}
                      onSave={v => updateDialogueLine(actIndex, sceneIndex, index, v)}
                      context={`Dialogue for ${dialogue.roleId}`}
                      language={language}
                      textClassName="text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                Không có hội thoại
              </div>
            )}
          </div>

          {/* 5. Environmental Effects (Hiệu ứng Môi trường) */}
          <PromptSection
            icon={<Cloud className="size-5" />}
            label="🌤️ Hiệu ứng Môi trường (Environmental Effects)"
            value={scene.audio_style}
            onSave={v => updateSceneField(actIndex, sceneIndex, 'audio_style', v)}
            context="Environmental Effects & Audio Style"
            language={language}
            placeholder="Vd: Tiếng gió nhẹ, âm thanh chim hót, nhạc nền du dương"
          />

          {/* 6. Cinematic Style (Phong cách Điện ảnh) */}
          <PromptSection
            icon={<Camera className="size-5" />}
            label="🎥 Phong cách Điện ảnh/Chất lượng (Cinematic Style)"
            value={scene.visual_style}
            onSave={v => updateSceneField(actIndex, sceneIndex, 'visual_style', v)}
            context="Cinematic Style & Visual Quality"
            language={language}
            placeholder="Vd: Close-up, chuyển động camera mượt mà, ánh sáng tự nhiên, 4K, cinematic"
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="outline" onClick={handleCopyPrompt} className="w-full gap-2">
          <Copy className="size-4" />
          Copy toàn bộ prompt cho Veo 3.1
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Scene;
