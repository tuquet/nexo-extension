import { ApiAuthError } from '../../../../pages/new-tab/src/services/api-errors';
import { PLOT_POINTS_SCHEMA, SCRIPT_GENERATION_SCHEMA } from '../schemas/script-schema';
import { getSystemInstruction } from '@extension/shared';
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';
import type {
  EnhanceTextParams,
  GenerateImageParams,
  GenerateScriptParams,
  GenerateVideoParams,
  IAIService,
  SuggestPlotsParams,
} from '../core/interfaces';
import type { ScriptStory } from '../types/messages';

/**
 * GeminiAIService - Encapsulates all Gemini AI API operations
 *
 * Implements IAIService interface for dependency injection.
 * Handles script generation, image generation, video generation, and text enhancement.
 *
 * @example
 * ```typescript
 * const service = new GeminiAIService();
 * const script = await service.generateScript({
 *   apiKey: 'your-key',
 *   prompt: 'A sci-fi thriller...',
 *   language: 'vi-VN',
 * });
 * ```
 */
export class GeminiAIService implements IAIService {
  /**
   * Initialize Google GenAI client with API key
   * @throws {ApiAuthError} If API key is missing
   */
  private getClient(apiKey: string): GoogleGenAI {
    if (!apiKey) {
      throw new ApiAuthError('Khóa API Gemini chưa được thiết lập trong trang Tùy chọn.');
    }
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Generate complete movie script from prompt
   *
   * @param params Script generation parameters
   * @returns Structured ScriptStory object with acts, scenes, dialogues
   * @throws {ApiAuthError} If API key is invalid
   * @throws {Error} If API returns empty response
   */
  async generateScript(params: GenerateScriptParams): Promise<ScriptStory> {
    const client = this.getClient(params.apiKey);

    // Determine system instruction based on language
    const systemInstruction = params.systemInstruction || getSystemInstruction(params.language as 'en-US' | 'vi-VN');

    // Use custom schema if provided, otherwise default
    const responseSchema = params.customSchema || SCRIPT_GENERATION_SCHEMA;

    const result = await client.models.generateContent({
      model: params.modelName,
      contents: params.prompt,
      config: {
        systemInstruction,
        temperature: params.temperature,
        topP: params.topP,
        topK: params.topK,
        maxOutputTokens: params.maxOutputTokens,
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
  }

  /**
   * Suggest plot points based on genre, tone, and context
   *
   * @param params Plot suggestion parameters
   * @returns Array of suggested plot points
   */
  async suggestPlotPoints(params: SuggestPlotsParams): Promise<string[]> {
    const client = this.getClient(params.apiKey);

    const systemInstruction = `You are a creative story consultant.
      Generate ${params.count || 5} diverse, engaging plot point suggestions based on the user's requirements.
      Return as JSON array of strings.`;

    const prompt = `Genre: ${params.genre}
Tone: ${params.tone}
${params.context ? `Context: ${params.context}` : ''}

Generate ${params.count || 5} unique plot points:`;

    const result = await client.models.generateContent({
      model: params.modelName,
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
      config: {
        temperature: 1.2,
        responseMimeType: 'application/json',
        responseSchema: PLOT_POINTS_SCHEMA,
      },
    });

    const text = result.text;
    if (!text) {
      throw new Error('API did not return plot suggestions.');
    }

    const parsed = JSON.parse(text) as { plot_points: string[] };
    return parsed.plot_points || [];
  }

  /**
   * Generate scene image using Imagen API
   *
   * @param params Image generation parameters
   * @returns Base64 data URL and MIME type
   */
  async generateImage(params: GenerateImageParams): Promise<{ imageUrl: string; mimeType: string }> {
    const client = this.getClient(params.apiKey);

    // Combine prompt with negative prompt if provided
    let finalPrompt = params.prompt;
    if (params.negativePrompt && params.negativePrompt.trim()) {
      finalPrompt += `\n\n---\n**Không bao gồm (Negative Prompt):** ${params.negativePrompt}`;
    }

    const response = await client.models.generateImages({
      model: params.modelName,
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: params.aspectRatio,
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
  }

  /**
   * Generate scene video using Veo API
   *
   * Handles long-running video generation with polling mechanism.
   * Polls every 10 seconds until operation completes.
   *
   * @param params Video generation parameters
   * @returns Base64 video data URL
   */
  async generateVideo(params: GenerateVideoParams): Promise<{ videoUrl: string }> {
    const client = this.getClient(params.apiKey);

    let operation = await client.models.generateVideos({
      model: params.modelName,
      prompt: params.prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: params.aspectRatio,
      },
      ...(params.startImage
        ? {
            image: {
              imageBytes: params.startImage.data,
              mimeType: params.startImage.mimeType,
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
    const videoResponse = await fetch(`${downloadLink}&key=${params.apiKey}`);

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
  }

  /**
   * Enhance text using AI for better quality and engagement
   *
   * @param params Text enhancement parameters
   * @returns Enhanced text without preamble
   */
  async enhanceText(params: EnhanceTextParams): Promise<string> {
    const client = this.getClient(params.apiKey);

    const systemInstruction = `You are a creative writing assistant.
      Your task is to refine, enhance, or rewrite a piece of text for a movie script based on the provided context.
      Make it more vivid, engaging, and professional.
      Respond ONLY with the improved text, without any preamble or explanation.`;

    const prompt = `
Context: ${params.context}
Text to improve: "${params.text}"

Improved text:
    `.trim();

    const result = await client.models.generateContent({
      model: params.modelName,
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

    return text;
  }

  /**
   * Test API key validity with minimal API call
   *
   * @param apiKey Google AI Studio API key
   * @returns Validation result with model name if successful
   * @throws {Error} With specific error message for auth, quota, or permission issues
   */
  async testConnection(apiKey: string): Promise<{ valid: boolean; model?: string }> {
    if (!apiKey || apiKey.length < 20) {
      throw new Error('API key is invalid or too short');
    }

    try {
      const client = this.getClient(apiKey);

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
  }
}
