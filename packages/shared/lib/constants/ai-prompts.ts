import { Type } from '@google/genai';
/**
 * Centralized AI System Instructions & Prompts
 * Single source of truth for all AI generation prompts across the extension
 *
 * Usage:
 * - Frontend: import from '@extension/shared'
 * - Backend: import from '@extension/shared'
 */

/**
 * System instruction for script generation (English)
 * Used by: gemini-ai-service.ts, prompt-builder.ts
 */
export const SYSTEM_INSTRUCTION_SCRIPT_EN = `Return ONLY valid JSON (JSON.stringify)`;

/**
 * JSON schema for script generation using Gemini API.
 * Defines the three-act structure for movie scripts.
 */
export const SCRIPT_GENERATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'The hook title of the movie. (capitalize)' },
    alias: { type: Type.STRING, description: 'the-title-alias-webfriendly' },
    logline: { type: Type.STRING, description: 'A one-sentence summary of the story.' },
    genre: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of genres that describe the movie.',
    },
    tone: {
      type: Type.STRING,
      description: "The overall tone or mood of the story (e.g., 'dark and gritty', 'lighthearted and comedic').",
    },
    themes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'A list of central themes or ideas explored in the story.',
    },
    notes: { type: Type.STRING, description: "General production notes or director's vision for the script." },
    setting: {
      type: Type.OBJECT,
      properties: {
        time: {
          type: Type.STRING,
          description: "The time period in which the story is set (e.g., 'Present Day', '2042').",
        },
        location: {
          type: Type.STRING,
          description: "The primary physical location of the story (e.g., 'A remote space station').",
        },
      },
      required: ['time', 'location'],
    },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The character's name." },
          roleId: {
            type: Type.STRING,
            description:
              "A unique, non-accented, camelCase identifier for the character's role. This ID links dialogues to this character.",
          },
          description: {
            type: Type.STRING,
            description:
              "A brief, human-readable description of the character's personality, appearance, and motivations.",
          },
        },
        required: ['name', 'roleId', 'description'],
      },
    },
    acts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          act_number: { type: Type.INTEGER, description: 'The act number (e.g., 1, 2, 3).' },
          summary: { type: Type.STRING, description: 'A summary of the events that occur in this act.' },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: { type: Type.INTEGER, description: 'The scene number within the act.' },
                location: { type: Type.STRING, description: 'The specific location of the scene.' },
                time: { type: Type.STRING, description: "The time of day for the scene (e.g., 'Day', 'Night')." },
                action: { type: Type.STRING, description: 'A description of the key actions and events in the scene.' },
                visual_style: {
                  type: Type.STRING,
                  description:
                    "The visual aesthetic for the scene (e.g., 'High-contrast noir lighting', 'Sweeping desert vistas').",
                },
                audio_style: {
                  type: Type.STRING,
                  description:
                    "The auditory style for the scene (e.g., 'Tense, orchestral score', 'Ambient, futuristic sounds').",
                },
                dialogues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      roleId: {
                        type: Type.STRING,
                        description:
                          "The roleId of the speaking character. Must match a 'roleId' from the 'characters' list.",
                      },
                      line: { type: Type.STRING, description: 'The dialogue spoken by the character.' },
                    },
                    required: ['roleId', 'line'],
                  },
                },
              },
              required: ['scene_number', 'location', 'time', 'action', 'visual_style', 'audio_style', 'dialogues'],
            },
          },
        },
        required: ['act_number', 'summary', 'scenes'],
      },
    },
  },
  required: ['title', 'alias', 'logline', 'genre', 'tone', 'themes', 'notes', 'setting', 'characters', 'acts'],
};

export const PLOT_POINTS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: 'A single, concise plot point or story twist suggestion.',
      },
      description: 'An array of 3 to 5 plot point suggestions.',
    },
  },
  required: ['suggestions'],
};

/**
 * JSON schema for CHAPTER/ACT-ONLY generation (Long-form content)
 * Used when generating one chapter at a time due to token limits
 *
 * Use case: Podcast, long-form video where each chapter needs separate generation
 * Frontend will wrap this into full ScriptStory structure
 */
export const ACTS_ONLY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    acts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          act_number: { type: Type.INTEGER, description: 'The act/chapter number (e.g., 1, 2, 3).' },
          summary: { type: Type.STRING, description: 'A summary of the content/events in this chapter.' },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: {
                  type: Type.INTEGER,
                  description: 'The scene number within the act (usually 1 for long-form).',
                },
                location: { type: Type.STRING, description: 'The location/setting of the scene.' },
                time: { type: Type.STRING, description: "The time of day (e.g., 'Day', 'Night', 'Evening')." },
                action: {
                  type: Type.STRING,
                  description: 'Description of visual actions, setting details for this scene.',
                },
                visual_style: {
                  type: Type.STRING,
                  description: 'Visual aesthetic (e.g., "Cinematic, warm lighting", "B-roll nature footage").',
                },
                audio_style: {
                  type: Type.STRING,
                  description: 'Auditory style (e.g., "Ambient music, clear narration", "Zen background sounds").',
                },
                dialogues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      roleId: {
                        type: Type.STRING,
                        description: 'The roleId of the speaker (e.g., "narrator", "host").',
                      },
                      line: {
                        type: Type.STRING,
                        description:
                          'The full content/dialogue for this chapter. For long-form content, this should be 800-1200 words.',
                      },
                    },
                    required: ['roleId', 'line'],
                  },
                },
              },
              required: ['scene_number', 'location', 'time', 'action', 'visual_style', 'audio_style', 'dialogues'],
            },
          },
        },
        required: ['act_number', 'summary', 'scenes'],
      },
      description:
        'Array of acts/chapters. For token-limited generation, typically contains only 1 act with full content.',
    },
  },
  required: ['acts'],
};
