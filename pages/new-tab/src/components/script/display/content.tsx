import Scene from '../cards/scene';
import { SceneForm } from '../forms/scene-form';
import EditableField from '../ui/editable-field';
import { Badge, Button } from '@extension/ui';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ScriptStory } from '@src/types';
import type { FC } from 'react';

interface ScriptContentProps {
  script: ScriptStory;
  language: 'en-US' | 'vi-VN';
}

const ScriptContent: FC<ScriptContentProps> = ({ script, language }) => {
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [currentActIndex, setCurrentActIndex] = useState<number>(0);

  const updateRootField = useScriptsStore(s => s.updateRootField);
  const updateActSummary = useScriptsStore(s => s.updateActSummary);
  const addAct = useScriptsStore(s => s.addAct);
  const deleteAct = useScriptsStore(s => s.deleteAct);
  const addScene = useScriptsStore(s => s.addScene);
  const activeSceneIdentifier = useScriptsStore(s => s.activeSceneIdentifier);
  const setActiveSceneIdentifier = useScriptsStore(s => s.setActiveSceneIdentifier);

  const handleDeleteAct = async (actIndex: number) => {
    if (script.acts.length <= 1) {
      toast.error('Không thể xóa', { description: 'Phải có ít nhất 1 hồi' });
      return;
    }
    if (confirm(`Xóa HỒI ${script.acts[actIndex].act_number}?`)) {
      await deleteAct(actIndex);
      toast.success('Đã xóa hồi');
    }
  };

  const handleOpenSceneDialog = (actIndex: number) => {
    setCurrentActIndex(actIndex);
    setSceneDialogOpen(true);
  };

  const handleSceneSubmit = async () => {
    // Scene dialog just triggers, actual scene is created by addScene store action with defaults
    await addScene(currentActIndex);
    setSceneDialogOpen(false);
    toast.success('Đã thêm cảnh mới');
  };

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          <EditableField
            initialValue={script.title}
            onSave={v => updateRootField('title', v)}
            context="Movie Title"
            language={language}
            as="input"
            textClassName="text-center w-full"
          />
        </h1>
        <div className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          {' '}
          {/* This was already a div, so no change here */}
          <EditableField
            initialValue={script.logline}
            onSave={v => updateRootField('logline', v)}
            context="Movie Logline"
            language={language}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {script.genre.map(g => (
            <Badge key={g} variant="secondary" className="capitalize">
              {g}
            </Badge>
          ))}
        </div>
      </div>

      {script.acts.map((act, actIndex) => (
        <section key={act.act_number}>
          <div className="bg-background/70 sticky top-0 z-10 -mx-4 -my-4 mb-4 px-4 py-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">HỒI {act.act_number}</h2>
                <div className="mt-1 text-slate-600 dark:text-slate-400">
                  <EditableField
                    initialValue={act.summary}
                    onSave={v => updateActSummary(actIndex, v)}
                    context={`Summary for Act ${act.act_number}`}
                    language={language}
                  />
                </div>
              </div>
              {script.acts.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteAct(actIndex)}
                  className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950">
                  <Trash2 className="size-4" />
                  Xóa Hồi
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-8">
            {act.scenes.map((scene, sceneIndex) => {
              const isActive =
                activeSceneIdentifier?.actIndex === actIndex && activeSceneIdentifier?.sceneIndex === sceneIndex;
              return (
                <div
                  key={scene.scene_number}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveSceneIdentifier({ actIndex, sceneIndex })}
                  onMouseOver={() => setActiveSceneIdentifier({ actIndex, sceneIndex })}
                  onFocus={() => setActiveSceneIdentifier({ actIndex, sceneIndex })}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveSceneIdentifier({ actIndex, sceneIndex });
                    }
                  }}
                  className={`cursor-pointer rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'ring-primary ring-2 ring-offset-4 ring-offset-slate-50 dark:ring-offset-slate-900'
                      : 'hover:ring-primary/50 hover:ring-2'
                  }`}
                  id={`scene-${actIndex}-${sceneIndex}`}>
                  <Scene
                    actIndex={actIndex}
                    sceneIndex={sceneIndex}
                    scene={scene}
                    language={language}
                    onAddScene={handleOpenSceneDialog}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Add Act button */}
      <div className="flex justify-center pb-8">
        <Button size="default" onClick={() => addAct()} className="gap-2">
          <Plus className="size-4" />
          Thêm Hồi Mới
        </Button>
      </div>

      {/* Scene Creation Dialog */}
      <SceneForm open={sceneDialogOpen} onOpenChange={setSceneDialogOpen} onSubmit={handleSceneSubmit} mode="create" />
    </div>
  );
};

export default ScriptContent;
