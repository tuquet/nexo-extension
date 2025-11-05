/**
 * Prompt Categories & Related Constants
 * Shared across new-tab and side-panel for consistent prompt management
 */

/**
 * Available prompt categories
 */
export const PROMPT_CATEGORIES = [
  'script-generation',
  'image-generation',
  'video-generation',
  'character-dev',
  'general',
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

/**
 * Category metadata with labels and icons
 */
export const PROMPT_CATEGORY_META: Record<
  PromptCategory,
  {
    label: string;
    icon: string;
    description: string;
  }
> = {
  'script-generation': {
    label: 'Script Generation',
    icon: '🎬',
    description: 'Templates for generating movie scripts with various structures',
  },
  'image-generation': {
    label: 'Image Generation',
    icon: '📸',
    description: 'Prompts for creating cinematic images and character portraits',
  },
  'video-generation': {
    label: 'Video Generation',
    icon: '🎥',
    description: 'Scene blocking and camera movement descriptions for video',
  },
  'character-dev': {
    label: 'Character Development',
    icon: '🎭',
    description: 'Character backstory, personality, and arc development',
  },
  general: {
    label: 'General',
    icon: '✨',
    description: 'General-purpose prompts and utilities',
  },
};

/**
 * Get category options for dropdowns/selects
 */
export const getCategoryOptions = () => [
  { value: 'all', label: 'All Categories', icon: '📋' },
  ...PROMPT_CATEGORIES.map(cat => ({
    value: cat,
    label: PROMPT_CATEGORY_META[cat].label,
    icon: PROMPT_CATEGORY_META[cat].icon,
  })),
];

/**
 * Validate if a string is a valid prompt category
 */
export const isValidPromptCategory = (value: string): value is PromptCategory =>
  PROMPT_CATEGORIES.includes(value as PromptCategory);

/**
 * Get category metadata by value
 */
export const getCategoryMeta = (category: PromptCategory) => PROMPT_CATEGORY_META[category];
