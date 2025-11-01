import EditableField from './editable-field';
import { db } from '../../db';
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
import { useAudioPlayerStore } from '@src/stores/use-audio-player-store';
import { Video, Headphones, PlayCircle, PauseCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Scene } from '../../types';
import type React from 'react';

interface SceneCardProps {
  scene: Scene;
  onUpdateField: (path: string, value: string | number) => void;
  language: 'en-US' | 'vi-VN';
  scriptUpdatedAt?: number; // Prop mới để trigger re-render
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

const SceneCard: React.FC<SceneCardProps> = ({ scene, onUpdateField, language }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { playingSource, isPlaying, isLoading, togglePlay } = useAudioPlayerStore();

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>CẢNH {scene.scene_number}</CardTitle>
        <CardDescription>
          {scene.location} - {scene.time}
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
        <blockquote className="mt-6 border-l-2 pl-6 italic">
          <EditableField
            initialValue={scene.action}
            onSave={v => onUpdateField('action', v)}
            context="Scene Action Description"
            language={language}
            textClassName="whitespace-pre-wrap"
          />
        </blockquote>

        {scene.dialogues.length > 0 && (
          <div className="mt-8">
            <h5 className="mb-2 text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400">Hội thoại</h5>
            <div className="mt-4 space-y-6">
              {scene.dialogues.map((dialogue, index) => (
                <div key={index} className="relative pl-4">
                  <div className="absolute left-0 top-0 h-full w-0.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold uppercase text-slate-800 dark:text-slate-200">{dialogue.roleId}</div>
                    {dialogue.audioLink && (
                      <Button
                        variant={'ghost'}
                        size="icon"
                        onClick={() => togglePlay(dialogue.audioLink!)}
                        aria-label="Play dialogue"
                        className="h-6 w-6">
                        {isLoading && playingSource === dialogue.audioLink ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        ) : isPlaying && playingSource === dialogue.audioLink ? (
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
                      onSave={v => onUpdateField(`dialogues[${index}].line`, v)}
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
            onSave={v => onUpdateField('visual_style', v)}
            context="Scene Visual Style"
            language={language}
          />
          <InfoPill
            title="Phong cách âm thanh"
            content={scene.audio_style}
            icon={<Headphones className="h-5 w-5" />}
            onSave={v => onUpdateField('audio_style', v)}
            context="Scene Audio Style"
            language={language}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default SceneCard;
