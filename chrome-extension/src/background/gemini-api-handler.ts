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

/**
 * Default system instruction for script generation (Vietnamese)
 */
const DEFAULT_SYSTEM_INSTRUCTION_VI = `Bạn là một biên kịch chuyên nghiệp từng đoạt giải, có chuyên môn sâu rộng về mọi thể loại và định dạng. Nhiệm vụ của bạn là tạo ra một kịch bản phim hoàn chỉnh, sẵn sàng sản xuất dựa trên các yêu cầu chi tiết của người dùng.

**Tiêu chuẩn viết:**
- Tuân thủ định dạng kịch bản chuẩn ngành
- Xây dựng câu chuyện sinh động, giàu hình ảnh (show, don't tell)
- Viết lời thoại chân thực, phù hợp từng nhân vật
- Duy trì tông và nhịp độ nhất quán
- Bao gồm tiêu đề cảnh chính xác (INT./EXT., thời gian, địa điểm)
- Mô tả hành động chi tiết, giàu cảm giác
- Đảm bảo mỗi cảnh đều phát triển cốt truyện hoặc nhân vật

**Yêu cầu cấu trúc ba hồi:**
- Hồi 1 (25%): Thiết lập thế giới, giới thiệu nhân vật, sự kiện khởi đầu
- Hồi 2 (50%): Cao trào, bước ngoặt giữa, phát triển nhân vật
- Hồi 3 (25%): Đỉnh điểm, kết thúc, cảm xúc thăng hoa

**Hướng dẫn về nhân vật:**
- 'roleId' trong lời thoại PHẢI khớp với roleId của nhân vật trong mảng 'characters'
- LUÔN có nhân vật với roleId 'narrator' để dẫn truyện/thuyết minh
- Với cảnh không có lời thoại, tạo entry narrator với nội dung hành động của cảnh
- Mỗi nhân vật cần có giọng điệu, cách nói riêng biệt
- Mô tả nhân vật gồm ngoại hình, tính cách, hành trình phát triển

**Yêu cầu kỹ thuật:**
- Chỉ cung cấp lời thoại trong trường 'line' (không chèn chú thích, hành động, bối cảnh)
- Điền ĐẦY ĐỦ các trường trong JSON schema bằng nội dung sáng tạo, phù hợp
- Đảm bảo tính nhất quán nội bộ (tên, địa điểm, mốc thời gian)
- Cân bằng giữa lời thoại và mô tả hành động/hình ảnh

**Tiêu chuẩn chất lượng:**
- Văn phong chuyên nghiệp, phù hợp sản xuất
- Gây cảm xúc, động lực rõ ràng cho nhân vật
- Tiến triển cốt truyện logic, nhân quả
- Vòng cung truyện thỏa mãn, có mở đầu và kết thúc
- Nhịp độ phù hợp với thời lượng yêu cầu`;

/**
 * Default system instruction for script generation (English)
 */
const DEFAULT_SYSTEM_INSTRUCTION_EN = `You are an award-winning professional screenwriter with expertise across all genres and formats. Your task is to generate a complete, production-ready movie script based on the user's detailed specifications.

**Writing Standards:**
- Follow industry-standard screenplay format
- Create vivid, visual storytelling (show, don't tell)
- Write authentic, character-specific dialogue
- Maintain consistent tone and pacing throughout
- Include precise scene headings (INT./EXT., time, location)
- Provide detailed action lines with sensory details
- Ensure every scene advances plot or character development

**Three-Act Structure Requirements:**
- Act 1 (25%): Establish world, introduce characters, present inciting incident
- Act 2 (50%): Rising complications, midpoint twist, character growth
- Act 3 (25%): Climax, resolution, emotional payoff

**Character Guidelines:**
- The 'roleId' in dialogue MUST correspond to character roleIds in the 'characters' array
- ALWAYS include a character with roleId 'narrator' for voice-over capability
- For scenes without character dialogue, create a narrator entry with the scene's action text
- Each character should have distinct voice and speech patterns
- Character descriptions should include physical traits, personality, and arc

**Technical Requirements:**
- Provide only spoken words in dialogue 'line' field (no parentheticals, actions, or context)
- Fill ALL fields in the JSON schema with creative, relevant content
- Ensure internal consistency (names, locations, timelines)
- Balance dialogue with action/visual storytelling

**Quality Standards:**
- Professional writing quality suitable for production
- Emotionally engaging with clear character motivations
- Logical plot progression with cause-and-effect
- Satisfying narrative arc with setup and payoff
- Appropriate pacing for the specified duration`;

/**
 * Generate a complete movie script using Gemini API
 * @param message - Script generation message with prompt and configuration
 * @returns Generated script with three-act structure
 */
export const handleGenerateScript = async (
  message: GeminiGenerateScriptMessage,
): Promise<BaseResponse<ScriptStory>> => {
  const { payload } = message;

  return handleApiResponse<ScriptStory>(
    (async () => {
      const settings = await getSettings();
      const apiKey = payload.apiKey || settings.apiKeys?.gemini || '';
      const client = getAiClient(apiKey);

      // Model configuration with fallbacks
      const modelName = payload.modelName || settings.modelSettings?.scriptGeneration || 'gemini-2.5-flash';
      const temperature = payload.temperature ?? settings.modelSettings?.temperature ?? 1.2;
      const topP = payload.topP ?? settings.modelSettings?.topP ?? 0.95;
      const topK = payload.topK ?? settings.modelSettings?.topK ?? 50;
      const maxOutputTokens = payload.maxOutputTokens ?? settings.modelSettings?.maxOutputTokens ?? 8192;

      // System instruction with language fallback
      const systemInstruction =
        payload.systemInstruction ||
        (payload.language === 'vi-VN' ? DEFAULT_SYSTEM_INSTRUCTION_VI : DEFAULT_SYSTEM_INSTRUCTION_EN);

      // Response schema with custom schema support
      const responseSchema = payload.customSchema || SCRIPT_GENERATION_SCHEMA;

      // Generate content with full configuration
      const result = await client.models.generateContent({
        model: modelName,
        contents: payload.prompt,
        config: {
          systemInstruction,
          temperature,
          topP,
          topK,
          maxOutputTokens,
          responseMimeType: 'application/json',
          responseSchema,
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
        throw new Error('API không trả về nội dung. Vui lòng thử lại.');
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

/**
 * Test Gemini API key validity with a minimal API call
 */
export const handleTestGeminiConnection = async (message: {
  type: string;
  payload: { apiKey: string };
}): Promise<BaseResponse<{ valid: boolean; model?: string }>> =>
  handleApiResponse<{ valid: boolean; model?: string }>(
    (async () => {
      const { apiKey } = message.payload;

      if (!apiKey || apiKey.length < 20) {
        throw new Error('API key is invalid or too short');
      }

      try {
        const client = getAiClient(apiKey);

        // Minimal test prompt - just verify API responds
        const result = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Test',
          config: {
            temperature: 1.0,
          },
        });

        const text = result.text;
        if (!text) {
          throw new Error('Invalid response from Gemini API');
        }

        return { valid: true, model: 'gemini-2.5-flash' };
      } catch (error) {
        if (error instanceof Error) {
          // Check for auth errors
          if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
            throw new Error('Invalid API key - please check your Google AI Studio key');
          }
          if (error.message.includes('403')) {
            throw new Error('API key access denied - check permissions in Google AI Studio');
          }
          if (error.message.includes('quota')) {
            throw new Error('API quota exceeded - your API key is valid but out of quota');
          }
        }
        throw error;
      }
    })(),
  );
