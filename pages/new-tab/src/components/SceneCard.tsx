import EditableField from './EditableField';
import { db } from '../db';
import { useState, useEffect } from 'react';
import type { Scene } from '../types';
import type React from 'react';

interface SceneCardProps {
  scene: Scene;
  onUpdateField: (path: string, value: string | number) => void;
  language: 'en-US' | 'vi-VN';
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
    <span className="mt-0.5 text-lg">{icon}</span>
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
    // Cleanup function to revoke the object URL and prevent memory leaks
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [scene.generatedImageId]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          CẢNH {scene.scene_number}
        </h3>
        <div className="flex items-center gap-2 text-xl">
          {scene.generatedImageId && <span title="Đã tạo ảnh">📷</span>}
          {scene.generatedVideoId && <span title="Đã tạo video">🎬</span>}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
        <EditableField
          initialValue={scene.location}
          onSave={v => onUpdateField('location', v)}
          context="Scene Location"
          language={language}
          as="input"
          textClassName="uppercase"
        />
        <span>-</span>
        <EditableField
          initialValue={scene.time}
          onSave={v => onUpdateField('time', v)}
          context="Scene Time of Day"
          language={language}
          as="input"
          textClassName="uppercase"
        />
      </div>

      {/* Display the generated image if it exists */}
      {imageUrl && (
        <div className="mt-4 aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-700">
          <img src={imageUrl} alt={`Hình ảnh cho Cảnh ${scene.scene_number}`} className="h-full w-full object-cover" />
        </div>
      )}

      <h5 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Hành động
      </h5>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-700 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
        <EditableField
          initialValue={scene.action}
          onSave={v => onUpdateField('action', v)}
          context="Scene Action Description"
          language={language}
          textClassName="whitespace-pre-wrap"
        />
      </div>

      {scene.dialogues.length > 0 && (
        <div className="mt-6">
          <h5 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Hội thoại
          </h5>
          <div className="space-y-4">
            {scene.dialogues.map((dialogue, index) => (
              <div key={index} className="grid grid-cols-[100px_1fr] gap-x-4">
                <div className="pt-1 text-right font-semibold uppercase text-slate-800 dark:text-slate-200">
                  {dialogue.role}
                </div>
                <EditableField
                  initialValue={dialogue.line}
                  onSave={v => onUpdateField(`dialogues[${index}].line`, v)}
                  context={`Dialogue line for ${dialogue.role}`}
                  language={language}
                  textClassName="text-slate-700 dark:text-slate-300"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <hr className="my-6 border-slate-200 dark:border-slate-700" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoPill
          title="Phong cách hình ảnh"
          content={scene.visual_style}
          icon="🎥"
          onSave={v => onUpdateField('visual_style', v)}
          context="Scene Visual Style"
          language={language}
        />
        <InfoPill
          title="Phong cách âm thanh"
          content={scene.audio_style}
          icon="🎧"
          onSave={v => onUpdateField('audio_style', v)}
          context="Scene Audio Style"
          language={language}
        />
      </div>
    </div>
  );
};

export default SceneCard;
