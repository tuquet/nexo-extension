import { ApiAuthError, ApiContentError } from './api-errors';
import { DEFAULT_MODELS, SCRIPT_GENERATION_SCHEMA, SYSTEM_INSTRUCTION_SCRIPT_EN } from '@extension/shared';
import { GoogleGenAI, Type } from '@google/genai';
import type { ScriptStory, AspectRatio } from '../types';

const getAiClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error('Khóa API không được cung cấp. Vui lòng thiết lập khóa API của bạn trong phần cài đặt.');
  }
  return new GoogleGenAI({ apiKey });
};

interface ScriptGenerationPayload {
  systemInstruction: string;
  userPrompt: string;
  schema: object;
}

/**
 * Chuẩn bị payload (system instruction, user prompt, và schema) để tạo kịch bản.
 * Hàm này tách biệt logic tạo prompt khỏi lời gọi API, giúp dễ dàng debug và tái sử dụng.
 * @param userPrompt - Lời nhắc của người dùng.
 * @param language - Ngôn ngữ cho kịch bản.
 * @returns Một đối tượng chứa systemInstruction, userPrompt, và schema.
 */
const getScriptGenerationPayload = (userPrompt: string): ScriptGenerationPayload => {
  const systemInstruction = SYSTEM_INSTRUCTION_SCRIPT_EN;
  return { systemInstruction, userPrompt, schema: SCRIPT_GENERATION_SCHEMA };
};

const generateScript = async (
  prompt: string,
  apiKey: string,
  modelName: string,
  temperature: number,
  topP: number,
): Promise<ScriptStory> => {
  try {
    const ai = getAiClient(apiKey);
    const { systemInstruction, userPrompt, schema } = getScriptGenerationPayload(prompt);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: temperature,
        topP: topP,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('API returned an empty response.');
    }

    return JSON.parse(text) as ScriptStory;
  } catch (error) {
    console.error('Lỗi tạo kịch bản:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('API key not valid')) {
      throw new ApiAuthError('Khóa API không hợp lệ. Vui lòng kiểm tra lại.');
    }
    if (errorMessage.includes('SAFETY')) {
      throw new ApiContentError('Nội dung bị chặn do cài đặt an toàn của Gemini. Vui lòng thử lại với prompt khác.');
    }
    throw new Error(`Không thể tạo kịch bản: ${errorMessage}`);
  }
};

const plotPointsSchema = {
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

const suggestPlotPoints = async (
  prompt: string,
  language: 'en-US' | 'vi-VN',
  apiKey: string,
  modelName: string,
): Promise<string[]> => {
  try {
    const ai = getAiClient(apiKey);
    const systemInstruction = `You are a creative story consultant and plot expert.
        Based on the user's logline and genres, generate 3 to 5 unique and compelling plot points or story twists in ${language}.
        These should be concise, one-sentence ideas that can be used to enrich a story.
        Focus on creating unexpected turns, raising the stakes, or introducing intriguing complications.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: plotPointsSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('API trả về phản hồi rỗng cho các gợi ý.');
    }

    const parsedResponse = JSON.parse(text) as { suggestions: string[] };
    return parsedResponse.suggestions || [];
  } catch (error) {
    console.error('Lỗi tạo tình tiết:', error);
    throw new Error(`Không thể gợi ý tình tiết. Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const generateSceneImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  apiKey: string,
  modelName: string,
  negativePrompt?: string,
): Promise<string> => {
  try {
    const ai = getAiClient(apiKey);
    const config = {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: aspectRatio,
    };

    let finalPrompt = prompt;
    if (negativePrompt && negativePrompt.trim()) {
      finalPrompt += `\n\n---\n**Không bao gồm (Negative Prompt):** ${negativePrompt}`;
    }

    const response = await ai.models.generateImages({
      model: modelName,
      prompt: finalPrompt,
      config: config,
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('API không trả về bất kỳ hình ảnh nào.');
    }

    const firstImage = response.generatedImages?.[0]?.image;
    if (!firstImage || !firstImage.imageBytes) {
      throw new Error('API không trả về imageBytes cho hình ảnh.');
    }
    const base64ImageBytes: string = firstImage.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error('Lỗi tạo ảnh cảnh:', error);
    throw new Error(`Không thể tạo ảnh cảnh. Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const enhanceText = async (
  textToEnhance: string,
  context: string,
  language: 'en-US' | 'vi-VN',
  apiKey: string,
): Promise<string> => {
  try {
    const ai = getAiClient(apiKey);
    const systemInstruction = `You are a creative writing assistant.
        Your task is to refine, enhance, or rewrite a piece of text for a movie script based on the provided context.
        Make it more vivid, engaging, and professional.
        Respond ONLY with the improved text in ${language}, without any preamble or explanation.`;

    const prompt = `
            Context: ${context}
            Text to improve: "${textToEnhance}"
            
            Improved text:
        `.trim();

    const response = await ai.models.generateContent({
      model: DEFAULT_MODELS.textEnhancement,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('API trả về phản hồi rỗng để nâng cao văn bản.');
    }

    return text.replace(/^"|"$/g, '');
  } catch (error) {
    console.error('Lỗi nâng cao văn bản:', error);
    throw new Error(`Không thể nâng cao văn bản. Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const generateSceneVideo = async (
  prompt: string,
  aspectRatio: AspectRatio,
  apiKey: string,
  modelName: string,
  startImage?: { mimeType: string; data: string },
): Promise<Blob> => {
  const videoAI = getAiClient(apiKey);
  try {
    const requestPayload = {
      model: modelName,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      },
      ...(startImage
        ? {
            image: {
              imageBytes: startImage.data,
              mimeType: startImage.mimeType,
            },
          }
        : {}),
    };

    let operation = await videoAI.models.generateVideos(requestPayload);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await videoAI.operations.getVideosOperation({ operation: operation });
    }

    if (!operation.response?.generatedVideos?.[0]?.video?.uri) {
      throw new Error('Quá trình tạo video đã hoàn tất, nhưng không có URI video nào được trả về.');
    }

    const downloadLink = operation.response.generatedVideos[0].video.uri;
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error('Tải video thất bại với trạng thái:', videoResponse.status, 'và thông báo:', errorText);
      throw new Error(`Không thể tải tệp video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return videoBlob;
  } catch (error) {
    console.error('Lỗi tạo video cảnh:', error);
    throw error;
  }
};
export type { ScriptGenerationPayload };
export {
  generateScript,
  generateSceneVideo,
  suggestPlotPoints,
  generateSceneImage,
  enhanceText,
  blobToBase64,
  getScriptGenerationPayload,
};
