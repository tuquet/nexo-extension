/**
 * Prompt Form Component
 * Comprehensive form for creating/editing prompts with all advanced options
 */

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Slider,
  Switch,
  Badge,
  Separator,
} from '@extension/ui';
import { Info, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PromptRecord } from '@src/db';

interface PromptFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PromptFormData) => void;
  initialData?: PromptRecord;
  mode: 'create' | 'edit';
}

interface PromptFormData {
  title: string;
  category: PromptRecord['category'];
  prompt: string;
  description?: string;
  tags?: string[];
  icon?: string;
  systemInstruction?: string;
  outputFormat?: string;
  modelSettings?: {
    preferredModel?: string;
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
  preprocessing?: {
    enableVariables?: boolean;
    variableDefinitions?: string;
    injectContext?: boolean;
  };
  postprocessing?: {
    steps?: Array<'trim' | 'remove-quotes' | 'parse-json' | 'extract-field'>;
  };
}

const CATEGORIES = [
  { value: 'script-generation', label: '🎬 Script Generation' },
  { value: 'image-generation', label: '🖼️ Image Generation' },
  { value: 'video-generation', label: '🎥 Video Generation' },
  { value: 'character-dev', label: '👤 Character Development' },
  { value: 'general', label: '💡 General' },
] as const;

const OUTPUT_FORMATS = [
  { value: 'json-structured', label: 'JSON (Structured Schema)', description: 'Use predefined JSON schema' },
  { value: 'json-free', label: 'JSON (Free-form)', description: 'Free-form JSON response' },
  { value: 'text', label: 'Plain Text', description: 'Plain text response' },
  { value: 'markdown', label: 'Markdown', description: 'Markdown formatted text' },
] as const;

const MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-exp-1206', label: 'Gemini Experimental' },
] as const;

const POSTPROCESSING_STEPS = [
  { value: 'trim', label: 'Trim Whitespace' },
  { value: 'remove-quotes', label: 'Remove Quotes' },
  { value: 'parse-json', label: 'Parse JSON' },
  { value: 'extract-field', label: 'Extract Field' },
] as const;

const PromptForm = ({ open, onOpenChange, onSubmit, initialData, mode }: PromptFormProps) => {
  const [activeTab, setActiveTab] = useState('basic');
  // Removed isJsonMode, setIsJsonMode, jsonInput, setJsonInput, jsonError, setJsonError (unused)
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    category: 'general',
    prompt: '',
    description: '',
    tags: [],
    icon: '',
    systemInstruction: '',
    outputFormat: 'json-structured',
    modelSettings: {
      preferredModel: 'gemini-2.5-flash',
      temperature: 1.0,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
    preprocessing: {
      enableVariables: false,
      variableDefinitions: '',
      injectContext: false,
    },
    postprocessing: {
      steps: ['trim', 'parse-json'],
    },
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        category: initialData.category,
        prompt: initialData.prompt,
        description: initialData.description || '',
        tags: initialData.tags || [],
        icon: initialData.icon || '',
        systemInstruction: initialData.systemInstruction || '',
        outputFormat: initialData.outputFormat || 'json-structured',
        modelSettings: initialData.modelSettings || {
          preferredModel: 'gemini-2.5-flash',
          temperature: 1.0,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
        preprocessing: initialData.preprocessing || {
          enableVariables: false,
          variableDefinitions: '',
          injectContext: false,
        },
        postprocessing: initialData.postprocessing || {
          steps: ['trim', 'parse-json'],
        },
      });
    }
  }, [initialData]);

  const handleSubmit = () => {
    onSubmit(formData);
    onOpenChange(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || [],
    }));
  };

  type PostprocessingStep = 'trim' | 'remove-quotes' | 'parse-json' | 'extract-field';
  const togglePostprocessingStep = (step: PostprocessingStep) => {
    setFormData(prev => {
      const currentSteps = prev.postprocessing?.steps || [];
      const newSteps = currentSteps.includes(step) ? currentSteps.filter(s => s !== step) : [...currentSteps, step];
      return {
        ...prev,
        postprocessing: {
          ...prev.postprocessing,
          steps: newSteps,
        },
      };
    });
  };

  // handleJsonModeToggle and handleJsonInputChange are unused, removed for lint compliance

  const handleSubmitWithValidation = () => {
    handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Prompt' : 'Edit Prompt'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Configure a new prompt template with advanced options'
              : 'Update prompt configuration and settings'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="prompt">Prompt & Instructions</TabsTrigger>
            <TabsTrigger value="model">Model Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Action Movie Generator"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  placeholder="🎬"
                  value={formData.icon}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  maxLength={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData({ ...formData, category: value as PromptRecord['category'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this prompt does"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={addTag}>
                    <Plus className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1">
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Prompt & Instructions Tab */}
          <TabsContent value="prompt" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="prompt">Prompt Template *</Label>
                <Textarea
                  id="prompt"
                  placeholder="Write your prompt here. Use {{variable}} syntax for dynamic values..."
                  value={formData.prompt}
                  onChange={e => setFormData({ ...formData, prompt: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">
                  <Info className="mr-1 inline size-3" />
                  Use <code className="bg-muted rounded px-1">{'{{variable_name}}'}</code> syntax for variables
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="systemInstruction">System Instruction (Optional)</Label>
                <Textarea
                  id="systemInstruction"
                  placeholder="Custom system instruction to override default behavior..."
                  value={formData.systemInstruction}
                  onChange={e => setFormData({ ...formData, systemInstruction: e.target.value })}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-muted-foreground text-xs">
                  Override the default system instruction for specialized behavior
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="outputFormat">Output Format</Label>
                <Select
                  value={formData.outputFormat}
                  onValueChange={value =>
                    setFormData({ ...formData, outputFormat: value as PromptFormData['outputFormat'] })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTPUT_FORMATS.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        <div>
                          <div className="font-medium">{format.label}</div>
                          <div className="text-muted-foreground text-xs">{format.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Model Settings Tab */}
          <TabsContent value="model" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="model">Preferred Model</Label>
                <Select
                  value={formData.modelSettings?.preferredModel}
                  onValueChange={value =>
                    setFormData({
                      ...formData,
                      modelSettings: { ...formData.modelSettings, preferredModel: value },
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="temperature">Temperature: {formData.modelSettings?.temperature?.toFixed(2)}</Label>
                <Slider
                  id="temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[formData.modelSettings?.temperature || 1.0]}
                  onValueChange={([value]) =>
                    setFormData({
                      ...formData,
                      modelSettings: { ...formData.modelSettings, temperature: value },
                    })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  Controls randomness (0.0 = deterministic, 2.0 = very creative)
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="topP">Top-P: {formData.modelSettings?.topP?.toFixed(2)}</Label>
                <Slider
                  id="topP"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[formData.modelSettings?.topP || 0.95]}
                  onValueChange={([value]) =>
                    setFormData({
                      ...formData,
                      modelSettings: { ...formData.modelSettings, topP: value },
                    })
                  }
                />
                <p className="text-muted-foreground text-xs">Nucleus sampling threshold</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="topK">Top-K</Label>
                <Input
                  id="topK"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.modelSettings?.topK || 40}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      modelSettings: { ...formData.modelSettings, topK: parseInt(e.target.value) || 40 },
                    })
                  }
                />
                <p className="text-muted-foreground text-xs">Limits token selection to top K candidates</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxTokens">Max Output Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min={1024}
                  max={8192}
                  step={256}
                  value={formData.modelSettings?.maxOutputTokens || 8192}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      modelSettings: {
                        ...formData.modelSettings,
                        maxOutputTokens: parseInt(e.target.value) || 8192,
                      },
                    })
                  }
                />
                <p className="text-muted-foreground text-xs">Maximum tokens in response (4096-8192 typical)</p>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Preprocessing</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableVariables">Enable Variables</Label>
                    <p className="text-muted-foreground text-xs">Allow {'{{variable}}'} syntax in prompts</p>
                  </div>
                  <Switch
                    id="enableVariables"
                    checked={formData.preprocessing?.enableVariables}
                    onCheckedChange={checked =>
                      setFormData({
                        ...formData,
                        preprocessing: { ...formData.preprocessing, enableVariables: checked },
                      })
                    }
                  />
                </div>

                {formData.preprocessing?.enableVariables && (
                  <div className="border-muted grid gap-2 border-l-2 pl-4">
                    <Label htmlFor="variableDefinitions">Variable Definitions (JSON)</Label>
                    <Textarea
                      id="variableDefinitions"
                      placeholder='[{"name": "genre", "type": "select", "label": "Genre", "options": [...], "default": "..."}]'
                      value={formData.preprocessing?.variableDefinitions}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          preprocessing: {
                            ...formData.preprocessing,
                            variableDefinitions: e.target.value,
                          },
                        })
                      }
                      rows={6}
                      className="font-mono text-xs"
                    />
                    <p className="text-muted-foreground text-xs">
                      JSON array defining variable names, types, labels, options, and defaults
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="injectContext">Inject Context</Label>
                    <p className="text-muted-foreground text-xs">Auto-inject character/setting context</p>
                  </div>
                  <Switch
                    id="injectContext"
                    checked={formData.preprocessing?.injectContext}
                    onCheckedChange={checked =>
                      setFormData({
                        ...formData,
                        preprocessing: { ...formData.preprocessing, injectContext: checked },
                      })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Postprocessing</h4>

                <div className="grid gap-2">
                  <Label>Processing Steps</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {POSTPROCESSING_STEPS.map(step => (
                      <div key={step.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`step-${step.value}`}
                          checked={formData.postprocessing?.steps?.includes(step.value as PostprocessingStep)}
                          onChange={() => togglePostprocessingStep(step.value as PostprocessingStep)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`step-${step.value}`} className="text-sm font-normal">
                          {step.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmitWithValidation} disabled={!formData.title || !formData.prompt}>
            {mode === 'create' ? 'Create Prompt' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { PromptForm };
export type { PromptFormData };
