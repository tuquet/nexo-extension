import Scene from '../cards/scene';
import EditableField from '../ui/editable-field';
import { Badge, Button, Textarea } from '@extension/ui';
import { useScriptsStore } from '@src/stores/use-scripts-store';
import { useEffect, useState, useRef } from 'react';
import type { ScriptStory } from '@src/types';
import type { FC } from 'react';

type ScriptViewMode = 'formatted' | 'json';

interface ScriptContentProps {
  script: ScriptStory;
  language: 'en-US' | 'vi-VN';
  viewMode: ScriptViewMode;
}

const ScriptContent: FC<ScriptContentProps> = ({ script, language, viewMode }) => {
  const updateRootField = useScriptsStore(s => s.updateRootField);
  const updateActSummary = useScriptsStore(s => s.updateActSummary);
  const activeSceneIdentifier = useScriptsStore(s => s.activeSceneIdentifier);
  const setActiveSceneIdentifier = useScriptsStore(s => s.setActiveSceneIdentifier);
  const saveActiveScript = useScriptsStore(s => s.saveActiveScript);
  const [jsonText, setJsonText] = useState(JSON.stringify(script, null, 2));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(script, null, 2));
  }, [script]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [jsonText, viewMode]);

  const handleSaveJson = async () => {
    try {
      const parsed = JSON.parse(jsonText) as ScriptStory | ScriptStory[];
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) throw new Error('Array empty');
        await saveActiveScript(parsed[0] as ScriptStory);
      } else {
        await saveActiveScript(parsed as ScriptStory);
      }
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'JSON không hợp lệ');
    }
  };

  if (viewMode === 'json') {
    return (
      <div>
        <Textarea
          ref={textareaRef}
          className="min-h-[300px] w-full resize-none font-mono"
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
        />
        {jsonError && <div className="mt-2 text-sm text-red-600">{jsonError}</div>}
        <div className="mt-3 flex gap-2">
          <Button onClick={handleSaveJson}>Lưu JSON</Button>
        </div>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">HỒI {act.act_number}</h2>
            <div className="mt-1 text-slate-600 dark:text-slate-400">
              {' '}
              <EditableField
                initialValue={act.summary}
                onSave={v => updateActSummary(actIndex, v)}
                context={`Summary for Act ${act.act_number}`}
                language={language}
              />
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
                  <Scene actIndex={actIndex} sceneIndex={sceneIndex} scene={scene} language={language} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ScriptContent;
