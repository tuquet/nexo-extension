import { GEMINI_SCRIPT_SCHEMA, PLOT_POINTS_SCHEMA } from './constants';
import { getSettings } from './settings-handler';
import { ApiAuthError } from '../../../pages/new-tab/src/services/api-errors';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import type {
  BaseResponse,
  GeminiEnhanceTextMessage,
  GeminiGenerateSceneImageMessage,
  GeminiGenerateSceneVideoMessage,
  GeminiGenerateScriptMessage,
  GeminiSuggestPlotPointsMessage,
  ScriptStory,
} from './types/messages';

// Helper to initialize the AI client safely

const getAiClient = (apiKey: string) => {
  if (!apiKey) {
    throw new ApiAuthError('Khóa API Gemini chưa được thiết lập trong trang Tùy chọn.');
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Wraps an API call in a standard response format.
 * @param promise The API call promise.
 * @returns A BaseResponse object with either 'data' or 'error'.
 */
const handleApiResponse = async <T>(promise: Promise<T>): Promise<BaseResponse<T>> => {
  try {
    const data = await promise;
    return { success: true, data };
  } catch (error) {
    console.error('Gemini API Handler Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof ApiAuthError ? 'AUTH_ERROR' : 'API_ERROR';
    return {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
      },
    };
  }
};

// --- Message Handlers ---

export const handleGenerateScript = async (
  message: GeminiGenerateScriptMessage,
): Promise<BaseResponse<ScriptStory>> => {
  const { payload } = message;

  return handleApiResponse<ScriptStory>(
    (async () => {
      const settings = await getSettings();
      const ai = getAiClient(settings.apiKeys?.gemini ?? '');
      const model = ai.getGenerativeModel({
        model: payload.modelName || settings.modelSettings?.scriptGeneration || 'gemini-2.5-flash',
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        generationConfig: {
          temperature: payload.temperature,
          topP: payload.topP,
          responseMimeType: 'application/json',
          responseSchema: JSON.parse(GEMINI_SCRIPT_SCHEMA),
        },
      });

      const systemInstruction = `You are a professional screenwriter. Based on the user's prompt, generate a complete and detailed movie script in ${payload.language}.
        The script must follow the three-act structure.
        Ensure every field in the provided JSON schema is filled with creative, relevant, and well-written content.
        The 'roleId' in dialogue must correspond to one of the character roleIds defined in the 'characters' array (e.g., 'Protagonist', 'Mentor'). Do not invent new roleIds for dialogue.
        For each dialogue 'line', provide only the spoken words. Do not include parenthetical remarks, actions, or context like '(internal monologue)' or '(shouting)'.
        IMPORTANT RULE: Always include a character with the roleId 'narrator' in the 'characters' list. For any scene that has no character dialogue, you MUST create a single entry in the 'dialogues' array. This entry will have the 'roleId' set to 'narrator' and the 'line' will be the exact content of the 'action' field for that scene. This ensures every scene has content for voice-over.`;
      const chat = model.startChat({
        history: [{ role: 'user', parts: [{ text: systemInstruction }] }],
      });
      const result = await chat.sendMessage(payload.prompt);

      const text = result.response.text();
      if (!text) {
        throw new Error('API returned an empty response.');
      }
      return JSON.parse(text) as ScriptStory;
    })(),
  );
};

export const handleSuggestPlotPoints = async (
  message: GeminiSuggestPlotPointsMessage,
): Promise<BaseResponse<string[]>> => {
  const { payload } = message;

  return handleApiResponse<string[]>(
    (async () => {
      const settings = await getSettings();
      const ai = getAiClient(settings.apiKeys?.gemini ?? '');
      const model = ai.getGenerativeModel({
        model: payload.modelName || settings.modelSettings?.plotSuggestion || 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: JSON.parse(PLOT_POINTS_SCHEMA),
        },
      });

      const systemInstruction = `You are a creative story consultant and plot expert.
          Based on the user's logline and genres, generate 3 to 5 unique and compelling plot points or story twists.
          These should be concise, one-sentence ideas that can be used to enrich a story.
          Focus on creating unexpected turns, raising the stakes, or introducing intriguing complications.`;

      const chat = model.startChat({
        history: [{ role: 'user', parts: [{ text: systemInstruction }] }],
      });

      const result = await chat.sendMessage(payload.prompt);
      const parsedResponse = JSON.parse(result.response.text()) as { suggestions: string[] };
      return parsedResponse.suggestions || [];
    })(),
  );
};

export const handleGenerateSceneImage = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  message: GeminiGenerateSceneImageMessage,
): Promise<BaseResponse<{ imageUrl: string; mimeType: string }>> =>
  // TODO: Implement image generation using Gemini Imagen API
  // Currently placeholder - needs actual Imagen API integration
  ({
    success: false,
    error: {
      message: 'Chức năng tạo ảnh chưa được triển khai trong background script.',
      code: 'NOT_IMPLEMENTED',
    },
  });

export const handleEnhanceText = async (message: GeminiEnhanceTextMessage): Promise<BaseResponse<string>> => {
  const { payload } = message;

  return handleApiResponse<string>(
    (async () => {
      const settings = await getSettings();
      const ai = getAiClient(payload.apiKey || settings.apiKeys?.gemini || '');
      const model = ai.getGenerativeModel({
        model: payload.modelName || settings.modelSettings?.scriptGeneration || 'gemini-2.5-flash',
      });

      const systemInstruction = `You are a creative writing assistant.
        Your task is to refine, enhance, or rewrite a piece of text for a movie script based on the provided context.
        Make it more vivid, engaging, and professional.
        Respond ONLY with the improved text, without any preamble or explanation.`;

      const prompt = `
            Context: ${payload.context}
            Text to improve: "${payload.text}"
            
            Improved text:
        `.trim();

      const chat = model.startChat({
        history: [{ role: 'user', parts: [{ text: systemInstruction }] }],
      });
      const result = await chat.sendMessage(prompt);
      const text = result.response.text()?.trim();

      if (!text) {
        throw new Error('API returned an empty response for text enhancement.');
      }
      return text.replace(/^"|"$/g, ''); // Remove quotes from response
    })(),
  );
};

export const handleGenerateSceneVideo = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  message: GeminiGenerateSceneVideoMessage,
): Promise<BaseResponse<{ videoUrl: string }>> =>
  // TODO: Implement video generation using Gemini Veo API
  // Currently placeholder - needs actual Veo API integration with polling logic
  ({
    success: false,
    error: {
      message: 'Chức năng tạo video chưa được triển khai trong background script.',
      code: 'NOT_IMPLEMENTED',
    },
  });
