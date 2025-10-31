import { TEXT_ENHANCEMENT_MODEL } from '../constants';
import { GoogleGenAI, Type } from '@google/genai';
import type { Root, AspectRatio } from '../types';

const getAiClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error('Khóa API không được cung cấp. Vui lòng thiết lập khóa API của bạn trong phần cài đặt.');
  }
  return new GoogleGenAI({ apiKey });
};

const scriptSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'The title of the movie.' },
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
        defaultAspectRatio: {
          type: Type.STRING,
          description: "The default aspect ratio for generated assets, e.g., '16:9'. Can be left empty.",
        },
        defaultImageModel: {
          type: Type.STRING,
          description: 'The default model for image generation. Can be left empty.',
        },
        defaultVideoModel: {
          type: Type.STRING,
          description: 'The default model for video generation. Can be left empty.',
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
          role: {
            type: Type.STRING,
            description: "The character's primary role in the story (e.g., 'Protagonist', 'Mentor', 'Antagonist').",
          },
          description: {
            type: Type.STRING,
            description: "A brief description of the character's personality, appearance, and motivations.",
          },
        },
        required: ['name', 'role', 'description'],
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
                      role: {
                        type: Type.STRING,
                        description:
                          "The role of the character speaking the line (e.g., 'Protagonist', 'Mentor'). Must match a role from the characters list.",
                      },
                      line: { type: Type.STRING, description: 'The dialogue spoken by the character.' },
                    },
                    required: ['role', 'line'],
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

const generateScript = async (
  prompt: string,
  language: 'en-US' | 'vi-VN',
  apiKey: string,
  modelName: string,
  temperature: number,
  topP: number,
): Promise<Root> => {
  try {
    const ai = getAiClient(apiKey);
    const systemInstruction = `You are a professional screenwriter. Based on the user's prompt, generate a complete and detailed movie script in ${language}.
        The script must follow the three-act structure.
        Ensure every field in the provided JSON schema is filled with creative, relevant, and well-written content.
        The 'role' in dialogue must correspond to one of the character roles defined in the 'characters' array (e.g., 'Protagonist', 'Mentor'). Do not invent new roles for dialogue.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: scriptSchema,
        temperature: temperature,
        topP: topP,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('API returned an empty response.');
    }

    return JSON.parse(text) as Root;
  } catch (error) {
    console.error('Lỗi tạo kịch bản:', error);
    throw new Error(
      `Không thể tạo kịch bản. Vui lòng kiểm tra khóa API và kết nối mạng của bạn. Chi tiết: ${error instanceof Error ? error.message : String(error)}`,
    );
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
      model: TEXT_ENHANCEMENT_MODEL,
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

export { generateScript, generateSceneVideo, suggestPlotPoints, generateSceneImage, enhanceText, blobToBase64 };
