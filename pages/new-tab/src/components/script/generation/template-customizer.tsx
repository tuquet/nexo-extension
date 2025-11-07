import { PromptEditor } from '../../prompts/prompt-editor';
import { Button, Card, CardDescription, CardHeader, CardTitle, toast } from '@extension/ui';
import { Edit, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { PromptRecord } from '@extension/database';

interface TemplateCustomizerProps {
  template: PromptRecord;
  onOverrideChange: (updatedTemplate: Partial<PromptRecord>) => void;
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({ template, onOverrideChange }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const hasCustomOverride = () => {
    const stored = localStorage.getItem(`template-override-${template.id}`);
    return !!stored;
  };

  const handleSave = (updatedData: Partial<PromptRecord>) => {
    try {
      // Save to localStorage
      localStorage.setItem(`template-override-${template.id}`, JSON.stringify(updatedData));

      // Notify parent
      onOverrideChange(updatedData);

      toast.success('Template customized', {
        description: 'All changes saved locally',
      });
    } catch (error) {
      toast.error('Failed to save customization', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <>
      <Card
        className={
          hasCustomOverride()
            ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
            : 'bg-slate-50 dark:bg-slate-900/50'
        }>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-base">
                {template.icon} {template.title}
                {hasCustomOverride() && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                    <AlertCircle className="size-3" />
                    Customized
                  </span>
                )}
              </CardTitle>
              <CardDescription className="mt-1">{template.description}</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditorOpen(true)} className="gap-1">
              <Edit className="size-3" />
              Customize
            </Button>
          </div>
        </CardHeader>
      </Card>

      <PromptEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        initialData={template}
        onSave={handleSave}
        title={`Customize Template: ${template.title}`}
        description="Edit all template settings. Changes are saved locally and don't affect the original template."
      />
    </>
  );
};
