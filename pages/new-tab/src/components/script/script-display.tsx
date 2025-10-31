import EditableField from './editable-field';
import SceneCard from './script-scene-card';
import { useScriptsStore } from '../../stores/use-scripts-store';
import type { Root } from '../../types';
import type React from 'react';

type ScriptViewMode = 'formatted' | 'json';

interface ScriptDisplayProps {
  script: Root;
  language: 'en-US' | 'vi-VN';
  viewMode: ScriptViewMode;
}

const ScriptDisplay: React.FC<ScriptDisplayProps> = ({ script, language, viewMode }) => {
  const updateScriptField = useScriptsStore(s => s.updateScriptField);
  const activeSceneIdentifier = useScriptsStore(s => s.activeSceneIdentifier);
  const setActiveSceneIdentifier = useScriptsStore(s => s.setActiveSceneIdentifier);

  if (viewMode === 'json') {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <pre className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">
          {JSON.stringify(script, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="border-b border-slate-200 pb-8 text-center dark:border-slate-700">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          <EditableField
            initialValue={script.title}
            onSave={v => updateScriptField('title', v)}
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
            onSave={v => updateScriptField('logline', v)}
            context="Movie Logline"
            language={language}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {script.genre.map(g => (
            <span
              key={g}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {g}
            </span>
          ))}
        </div>
      </header>

      {script.acts.map((act, actIndex) => (
        <section key={act.act_number}>
          <div className="bg-background sticky top-0 z-10 -my-4 mb-4 py-4 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">HỒI {act.act_number}</h2>
            <div className="mt-1 text-slate-600 dark:text-slate-400">
              {' '}
              <EditableField
                initialValue={act.summary}
                onSave={v => updateScriptField(`acts[${actIndex}].summary`, v)}
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
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveSceneIdentifier({ actIndex, sceneIndex });
                    }
                  }}
                  className={`cursor-pointer rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg'
                      : 'hover:ring-primary/50 hover:ring-2'
                  }`}
                  id={`scene-${actIndex}-${sceneIndex}`}>
                  <div className="bg-background h-full w-full rounded-[5px]">
                    <SceneCard
                      scene={scene}
                      onUpdateField={(path, value) =>
                        updateScriptField(`acts[${actIndex}].scenes[${sceneIndex}].${path}`, value)
                      }
                      language={language}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ScriptDisplay;
