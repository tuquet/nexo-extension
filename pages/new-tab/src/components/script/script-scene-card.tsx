import EditableField from './editable-field';
import {
  Card,
  CardHeader,
  CardAction,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from '@extension/ui';
import { db } from '@src/db';
import { useAudioPlayerStore } from '@src/stores/use-audio-player-store';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { Video, Headphones, PlayCircle, PauseCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Scene } from '@src/types';
import type React from 'react';

interface SceneCardProps {
  scene: Scene;
  language: 'en-US' | 'vi-VN';
  actIndex: number;
  sceneIndex: number;
}

const InfoPill: React.FC<{
  title: string;
  content: string;
  icon: React.ReactNode;
  onSave: (value: string) => void;
  context: string;
  language: 'en-US' | 'vi-VN';
}> = ({ title, content, icon, onSave, context, language }) => (
  <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
    <div className="flex-shrink-0 text-slate-500 dark:text-slate-400">{icon}</div>
    <div className="flex-1">
      <strong className="font-medium text-slate-800 dark:text-slate-200">{title}</strong>
      <div className="text-slate-600 dark:text-slate-400">
        <EditableField
          initialValue={content}
          onSave={onSave}
          context={context}
          language={language}
          textClassName="whitespace-pre-wrap"
        />
      </div>
    </div>
  </div>
);

const SceneCard: React.FC<SceneCardProps> = ({ scene, language, actIndex, sceneIndex }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { playingSource, isPlaying, isLoading, togglePlay } = useAudioPlayerStore();
  const updateSceneField = useScriptsStore(s => s.updateSceneField);
  const updateDialogueLine = useScriptsStore(s => s.updateDialogueLine);

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
          console.error('Lỗi tải ảnh từ DB cho SceneCard:', error);
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

    // Nếu đang phát chính audio này, chỉ cần toggle play/pause
    if (playingSource?.startsWith(`blob:`) && playingSource.includes(audioId.toString())) {
      togglePlay(playingSource);
      return;
    }

    try {
      useAudioPlayerStore.getState().setLoading(true);
      const audioRecord = await db.audios.get(audioId);
      if (audioRecord?.data) {
        const objectUrl = URL.createObjectURL(audioRecord.data);
        // Thêm ID vào URL để có thể xác định nguồn phát
        const urlWithId = `${objectUrl}#${audioId}`;
        togglePlay(urlWithId);
      } else {
        throw new Error('Audio record not found in DB.');
      }
    } catch (error) {
      console.error('Error playing audio from DB:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline justify-between">
          <span>CẢNH {scene.scene_number}</span>
        </CardTitle>
        <CardDescription className="mt-2 space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-20 flex-shrink-0 font-semibold capitalize text-slate-500 dark:text-slate-400">
              địa điểm:
            </span>
            <EditableField
              initialValue={scene.location}
              onSave={v => updateSceneField(actIndex, sceneIndex, 'location', v)}
              context="Scene Location"
              language={language}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 flex-shrink-0 font-semibold capitalize text-slate-500 dark:text-slate-400">
              thời gian:
            </span>
            <EditableField
              initialValue={scene.time}
              onSave={v => updateSceneField(actIndex, sceneIndex, 'time', v)}
              context="Scene Time"
              language={language}
            />
          </div>
        </CardDescription>
        <CardAction>
          {scene.generatedImageId && <span title="Đã tạo ảnh">📷</span>}
          {scene.generatedVideoId && <span title="Đã tạo video">🎬</span>}
        </CardAction>
      </CardHeader>
      <CardContent>
        {/* Display the generated image if it exists */}
        {imageUrl && (
          <div className="mt-4 aspect-video rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-700">
            <img
              src={imageUrl}
              alt={`Hình ảnh cho Cảnh ${scene.scene_number}`}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <h5 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Hành động
        </h5>
        <blockquote className="mt-6 border-l-2 pl-6">
          <EditableField
            initialValue={scene.action}
            onSave={v => updateSceneField(actIndex, sceneIndex, 'action', v)}
            context="Scene Action Description"
            language={language}
            textClassName="whitespace-pre-wrap"
          />
        </blockquote>

        {scene.dialogues.length > 0 && (
          <div className="mt-8">
            <h5 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Hội thoại
            </h5>
            <div className="mt-4 space-y-6">
              {scene.dialogues.map((dialogue, index) => (
                <div key={index} className="relative pl-4">
                  <div className="absolute left-0 top-0 h-full w-0.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{dialogue.roleId}</div>
                    {dialogue.generatedAudioId && (
                      <Button
                        variant={'ghost'}
                        size="icon"
                        onClick={() => handlePlayDialogue(dialogue)}
                        aria-label="Play dialogue"
                        className="h-6 w-6"
                        disabled={dialogue.isGeneratingAudio}>
                        {dialogue.isGeneratingAudio ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        ) : isLoading && playingSource?.includes(dialogue.generatedAudioId.toString()) ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        ) : isPlaying && playingSource?.includes(dialogue.generatedAudioId.toString()) ? (
                          <PauseCircle className="h-4 w-4 text-blue-500" />
                        ) : (
                          <PlayCircle className="h-4 w-4 text-slate-500" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="mt-1">
                    <EditableField
                      initialValue={dialogue.line}
                      onSave={v => updateDialogueLine(actIndex, sceneIndex, index, v)}
                      context={`Dialogue line for ${dialogue.roleId}`}
                      language={language}
                      textClassName="text-slate-700 dark:text-slate-300 leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoPill
            title="Phong cách hình ảnh"
            content={scene.visual_style}
            icon={<Video className="h-5 w-5" />}
            onSave={v => updateSceneField(actIndex, sceneIndex, 'visual_style', v)}
            context="Scene Visual Style"
            language={language}
          />
          <InfoPill
            title="Phong cách âm thanh"
            content={scene.audio_style}
            icon={<Headphones className="h-5 w-5" />}
            onSave={v => updateSceneField(actIndex, sceneIndex, 'audio_style', v)}
            context="Scene Audio Style"
            language={language}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default SceneCard;
