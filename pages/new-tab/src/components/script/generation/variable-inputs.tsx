import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@extension/ui';
import { Copy, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VariableDefinition {
  name: string;
  type: 'text' | 'select' | 'number' | 'textarea';
  label: string;
  placeholder?: string;
  default?: string;
  required?: boolean;
  options?: string[];
}

interface VariableInputsProps {
  variableDefinitions?: unknown; // DB layer returns parsed object/array
  onChange: (values: Record<string, string>) => void;
  promptTemplate?: string; // To give AI context
  templateId: number; // For localStorage persistence
  onCopyPrompt?: () => void; // Copy prompt handler
}

export const VariableInputs: React.FC<VariableInputsProps> = ({
  variableDefinitions,
  onChange,
  promptTemplate,
  templateId,
  onCopyPrompt,
}) => {
  const [variables] = useState<VariableDefinition[]>(() => {
    if (!variableDefinitions) return [];

    // variableDefinitions is already parsed by DB layer
    if (Array.isArray(variableDefinitions)) {
      return variableDefinitions as VariableDefinition[];
    }

    // Fallback: parse if still string (shouldn't happen with DB hooks)
    if (typeof variableDefinitions === 'string') {
      try {
        return JSON.parse(variableDefinitions);
      } catch {
        return [];
      }
    }

    return [];
  });

  const [values, setValues] = useState<Record<string, string>>(() => {
    // Try to load persisted values first
    const storageKey = `template-variables-${templateId}`;
    const savedValues = localStorage.getItem(storageKey);

    if (savedValues) {
      try {
        const parsed = JSON.parse(savedValues);
        // Ensure all current variables have values
        const defaults: Record<string, string> = {};
        variables.forEach(v => {
          defaults[v.name] = parsed[v.name] || v.default || '';
        });
        return defaults;
      } catch {
        // Fall through to defaults
      }
    }

    // Use default values
    const defaults: Record<string, string> = {};
    variables.forEach(v => {
      if (v.default) defaults[v.name] = v.default;
    });
    return defaults;
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Notify parent of default values on mount
  useEffect(() => {
    if (Object.keys(values).length > 0) {
      onChange(values);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleChange = (name: string, value: string) => {
    const newValues = { ...values, [name]: value };
    setValues(newValues);
    onChange(newValues);

    // Persist updated defaults to localStorage
    const storageKey = `template-variables-${templateId}`;
    localStorage.setItem(storageKey, JSON.stringify(newValues));
  };

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      // Build context prompt for AI
      const contextPrompt = `Based on this prompt template:
${promptTemplate || 'A creative prompt'}

Please suggest appropriate values for these variables:
${variables.map(v => `- ${v.label} (${v.name}): ${v.type}${v.options ? ` - options: ${v.options.join(', ')}` : ''}${v.placeholder ? ` - hint: ${v.placeholder}` : ''}`).join('\n')}

Return ONLY a valid JSON object with variable names as keys and suggested values as values.
For select types, choose from the provided options.
Make suggestions creative, diverse, and contextually appropriate.`;

      const response = await chrome.runtime.sendMessage({
        type: 'ENHANCE_TEXT',
        payload: {
          text: contextPrompt,
          instruction:
            'Generate creative, appropriate values for these variables. Return ONLY valid JSON format: {"variable_name": "value", ...}',
          temperature: 1.2,
        },
      });

      if (response.success && response.data) {
        try {
          // Try to parse JSON from response
          let jsonText = response.data.trim();
          // Remove markdown code blocks if present
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          // Find JSON object
          const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const suggestedValues = JSON.parse(jsonMatch[0]);

            // Validate and apply suggestions
            const newValues: Record<string, string> = { ...values };
            let appliedCount = 0;

            variables.forEach(variable => {
              if (suggestedValues[variable.name]) {
                const suggestedValue = String(suggestedValues[variable.name]);

                // Validate select options
                if (variable.type === 'select' && variable.options) {
                  if (variable.options.includes(suggestedValue)) {
                    newValues[variable.name] = suggestedValue;
                    appliedCount++;
                  }
                } else {
                  newValues[variable.name] = suggestedValue;
                  appliedCount++;
                }
              }
            });

            setValues(newValues);
            onChange(newValues);
            toast.success(`Applied ${appliedCount} AI suggestions`, {
              description: 'You can edit any values or regenerate for different suggestions',
            });
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          toast.error('Failed to parse AI suggestions', {
            description: 'Please try again or fill manually',
          });
        }
      } else {
        throw new Error(response.error || 'AI request failed');
      }
    } catch (error) {
      console.error('AI suggest failed:', error);
      toast.error('Failed to generate suggestions', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetToDefaults = () => {
    const defaults: Record<string, string> = {};
    variables.forEach(v => {
      if (v.default) defaults[v.name] = v.default;
    });
    setValues(defaults);
    onChange(defaults);
    toast.success('Reset to default values');
  };

  if (variables.length === 0) return null;

  return (
    <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">📝 Template Variables</span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={handleResetToDefaults} className="gap-1">
            <RefreshCw className="size-3" />
            Reset
          </Button>
          {onCopyPrompt && (
            <Button type="button" size="sm" variant="outline" onClick={onCopyPrompt} className="gap-1">
              <Copy className="size-3" />
              Copy Prompt
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleAISuggest}
            disabled={isGenerating}
            className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
            <Sparkles className="size-3" />
            {isGenerating ? 'Generating...' : 'AI Suggest'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {variables.map(variable => (
          <div key={variable.name} className="grid gap-2">
            <Label htmlFor={variable.name}>
              {variable.label}
              {variable.required && <span className="text-red-500">*</span>}
            </Label>

            {variable.type === 'select' && variable.options ? (
              <Select value={values[variable.name] || ''} onValueChange={value => handleChange(variable.name, value)}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${variable.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {variable.options.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : variable.type === 'textarea' ? (
              <Textarea
                id={variable.name}
                placeholder={variable.placeholder}
                value={values[variable.name] || ''}
                onChange={e => handleChange(variable.name, e.target.value)}
                rows={3}
              />
            ) : variable.type === 'number' ? (
              <Input
                id={variable.name}
                type="number"
                placeholder={variable.placeholder}
                value={values[variable.name] || ''}
                onChange={e => handleChange(variable.name, e.target.value)}
              />
            ) : (
              <Input
                id={variable.name}
                type="text"
                placeholder={variable.placeholder}
                value={values[variable.name] || ''}
                onChange={e => handleChange(variable.name, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
