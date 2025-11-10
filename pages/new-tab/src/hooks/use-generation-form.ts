/**
 * Generation Form Hook
 * Manages template selection and loading message state for script generation form
 * Extracted from generation-form.tsx to improve reusability and testability
 */

import { db } from '@extension/database';
import { toast } from '@extension/ui';
import { SCRIPT_GENERATION_LOADING_MESSAGES } from '@src/constants';
import { useEffect, useState } from 'react';
import type { PromptRecord } from '@extension/database';

interface UseGenerationFormOptions {
  preSelectedTemplate?: PromptRecord;
  isLoading?: boolean;
}

const useGenerationForm = (options: UseGenerationFormOptions = {}) => {
  const { preSelectedTemplate, isLoading = false } = options;

  const [activeTab, setActiveTab] = useState(preSelectedTemplate ? 'template' : 'template');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptRecord | null>(preSelectedTemplate || null);
  const [templates, setTemplates] = useState<PromptRecord[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<(typeof SCRIPT_GENERATION_LOADING_MESSAGES)[number]>(
    SCRIPT_GENERATION_LOADING_MESSAGES[0],
  );

  // Load templates from database
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const allTemplates = await db.prompts.reverse().toArray();
        setTemplates(allTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
        toast.error('Không thể tải danh sách template');
      }
    };

    void loadTemplates();
  }, []);

  // Rotate loading messages during generation
  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = SCRIPT_GENERATION_LOADING_MESSAGES.indexOf(prev);
          const nextIndex = (currentIndex + 1) % SCRIPT_GENERATION_LOADING_MESSAGES.length;
          return SCRIPT_GENERATION_LOADING_MESSAGES[nextIndex];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle pre-selected template
  useEffect(() => {
    if (preSelectedTemplate) {
      setSelectedTemplate(preSelectedTemplate);
      setActiveTab('template');
      toast.success(`Đã tải template "${preSelectedTemplate.title}"`);
    }
  }, [preSelectedTemplate]);

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    if (templateId === 'none') {
      setSelectedTemplate(null);
      return;
    }
    const template = templates.find(t => t.id?.toString() === templateId);
    if (template) {
      setSelectedTemplate(template);
      toast.success(`Đã chọn template "${template.title}"`);
    }
  };

  return {
    activeTab,
    setActiveTab,
    selectedTemplate,
    setSelectedTemplate,
    templates,
    loadingMessage,
    handleTemplateChange,
  };
};

export { useGenerationForm };
