import { SCRIPT_GENERATION_SCHEMA, PLOT_POINTS_SCHEMA } from './schemas/script-schema';
import { getSettings } from './settings-handler';
import { ApiAuthError } from '../../../pages/new-tab/src/services/api-errors';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
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
  return new GoogleGenAI({ apiKey });
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
      const client = getAiClient(settings.apiKeys?.gemini ?? '');

      const modelName = payload.modelName || settings.modelSettings?.scriptGeneration || 'gemini-2.5-flash';

      const systemInstruction = `You are a professional screenwriter. Based on the user's prompt, generate a complete and detailed movie script in ${payload.language}.
        The script must follow the three-act structure.
        Ensure every field in the provided JSON schema is filled with creative, relevant, and well-written content.
        The 'roleId' in dialogue must correspond to one of the character roleIds defined in the 'characters' array (e.g., 'Protagonist', 'Mentor'). Do not invent new roleIds for dialogue.
        For each dialogue 'line', provide only the spoken words. Do not include parenthetical remarks, actions, or context like '(internal monologue)' or '(shouting)'.
        IMPORTANT RULE: Always include a character with the roleId 'narrator' in the 'characters' list. For any scene that has no character dialogue, you MUST create a single entry in the 'dialogues' array. This entry will have the 'roleId' set to 'narrator' and the 'line' will be the exact content of the 'action' field for that scene. This ensures every scene has content for voice-over.`;

      const result = await client.models.generateContent({
        model: modelName,
        contents: payload.prompt,
        config: {
          systemInstruction,
          temperature: payload.temperature,
          topP: payload.topP,
          responseMimeType: 'application/json',
          responseSchema: SCRIPT_GENERATION_SCHEMA,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        },
      });

      const text = result.text;
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
      const client = getAiClient(settings.apiKeys?.gemini ?? '');

      const modelName = payload.modelName || settings.modelSettings?.plotSuggestion || 'gemini-2.5-flash';

      const systemInstruction = `You are a creative story consultant and plot expert.
          Based on the user's logline and genres, generate 3 to 5 unique and compelling plot points or story twists.
          These should be concise, one-sentence ideas that can be used to enrich a story.
          Focus on creating unexpected turns, raising the stakes, or introducing intriguing complications.`;

      const result = await client.models.generateContent({
        model: modelName,
        contents: payload.prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: PLOT_POINTS_SCHEMA,
        },
      });

      const text = result.text;
      if (!text) {
        throw new Error('API returned an empty response.');
      }
      const parsedResponse = JSON.parse(text) as { suggestions: string[] };
      return parsedResponse.suggestions || [];
    })(),
  );
};

export const handleGenerateSceneImage = async (
  message: GeminiGenerateSceneImageMessage,
): Promise<BaseResponse<{ imageUrl: string; mimeType: string }>> => {
  const { payload } = message;

  return handleApiResponse<{ imageUrl: string; mimeType: string }>(
    (async () => {
      const settings = await getSettings();
      const client = getAiClient(payload.apiKey || settings.apiKeys?.gemini || '');

      const modelName = payload.modelName || settings.modelSettings?.imageGeneration || 'imagen-3.0-generate-001';

      let finalPrompt = payload.prompt;
      if (payload.negativePrompt && payload.negativePrompt.trim()) {
        finalPrompt += `\n\n---\n**Không bao gồm (Negative Prompt):** ${payload.negativePrompt}`;
      }

      const response = await client.models.generateImages({
        model: modelName,
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: payload.aspectRatio,
        },
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error('API không trả về bất kỳ hình ảnh nào.');
      }

      const firstImage = response.generatedImages?.[0]?.image;
      if (!firstImage || !firstImage.imageBytes) {
        throw new Error('API không trả về imageBytes cho hình ảnh.');
      }

      const base64ImageBytes: string = firstImage.imageBytes;
      return {
        imageUrl: `data:image/jpeg;base64,${base64ImageBytes}`,
        mimeType: 'image/jpeg',
      };
    })(),
  );
};

export const handleEnhanceText = async (message: GeminiEnhanceTextMessage): Promise<BaseResponse<string>> => {
  const { payload } = message;

  return handleApiResponse<string>(
    (async () => {
      const settings = await getSettings();
      const client = getAiClient(payload.apiKey || settings.apiKeys?.gemini || '');

      const modelName = payload.modelName || settings.modelSettings?.scriptGeneration || 'gemini-2.5-flash';

      const systemInstruction = `You are a creative writing assistant.
        Your task is to refine, enhance, or rewrite a piece of text for a movie script based on the provided context.
        Make it more vivid, engaging, and professional.
        Respond ONLY with the improved text, without any preamble or explanation.`;

      const prompt = `
            Context: ${payload.context}
            Text to improve: "${payload.text}"
            
            Improved text:
        `.trim();

      const result = await client.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: systemInstruction }],
          },
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      });

      const text = result.text?.trim();

      if (!text) {
        throw new Error('API returned an empty response for text enhancement.');
      }
      return text.replace(/^"|"$/g, ''); // Remove quotes from response
    })(),
  );
};

export const handleGenerateSceneVideo = async (
  message: GeminiGenerateSceneVideoMessage,
): Promise<BaseResponse<{ videoUrl: string }>> => {
  const { payload } = message;

  return handleApiResponse<{ videoUrl: string }>(
    (async () => {
      const settings = await getSettings();
      const client = getAiClient(payload.apiKey || settings.apiKeys?.gemini || '');

      const modelName = payload.modelName || settings.modelSettings?.videoGeneration || 'veo-2.0-generate-001';

      let operation = await client.models.generateVideos({
        model: modelName,
        prompt: payload.prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: payload.aspectRatio,
        },
        ...(payload.startImage
          ? {
              image: {
                imageBytes: payload.startImage.data,
                mimeType: payload.startImage.mimeType,
              },
            }
          : {}),
      });

      // Polling logic - check operation status every 10 seconds
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10s polling interval
        operation = await client.operations.getVideosOperation({ operation });
      }

      if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
        throw new Error('Video generation completed but no URI returned.');
      }

      const downloadLink = operation.response.generatedVideos[0].video.uri;
      const apiKey = payload.apiKey || settings.apiKeys?.gemini || '';
      const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);

      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }

      const videoBlob = await videoResponse.blob();

      // Convert to base64 for message passing
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(videoBlob);
      const dataUrl = await base64Promise;

      return { videoUrl: dataUrl };
    })(),
  );
};
