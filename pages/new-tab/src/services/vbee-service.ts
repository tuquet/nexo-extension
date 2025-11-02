import type { ScriptStory } from '../types';

/**
 * Represents a block in a Vbee project, analogous to a scene in our script.
 */
interface VbeeProjectBlockPayload {
  id: string; // Vbee expects a UUID here.
  characters: number;
  speed: number;
  voice_code: string;
  break_time: number; // break time in seconds after the block
  text: string;
}

/**
 * The payload required to create a new project on Vbee.
 */
export interface CreateVbeeProjectPayload {
  title: string;
  product: 'TTS';
  isDeleted: boolean;
  blocks: VbeeProjectBlockPayload[];
}

/**
 * Represents the status response for a Vbee project.
 * NOTE: The structure is presumed. Adjust if the actual API response differs.
 */
export interface VbeeProjectStatusResponse {
  result: {
    project: {
      id: string;
      status: 'processing' | 'done' | 'error';
      audio_link?: string;
      blocks: Array<{
        id: string;
        audio_link: string;
      }>;
      // other fields...
    };
  };
}

export interface VbeeTransformationResult {
  payload: CreateVbeeProjectPayload;
  updatedScript: ScriptStory;
}

/**
 * Transforms the application's script format into the Vbee project creation payload.
 * Each dialogue line becomes a separate block to allow for different voices.
 * @param script The script object to transform.
 * @param defaultVoiceCode The default Vbee voice code to use if a character's voice is not specified.
 * @param characterVoiceMap A map of character roleIds to their assigned Vbee voice codes. * @returns An object containing the payload for Vbee and the updated script with vbeeBlockIds.
 */
export const transformScriptToVbeeProject = (
  script: ScriptStory,
  defaultVoiceCode: string,
  characterVoiceMap: Record<string, string> = {},
): VbeeTransformationResult => {
  const updatedScript = structuredClone(script);
  const vbeeBlocks: VbeeProjectBlockPayload[] = [];

  updatedScript.acts.forEach(act => {
    act.scenes.forEach(scene => {
      scene.dialogues?.forEach(dialogue => {
        if (dialogue.line && dialogue.line.trim() !== '') {
          // Chỉ tạo blockId mới nếu nó chưa tồn tại.
          // Điều này đảm bảo ID không thay đổi giữa các lần tạo payload.
          const blockId = dialogue.projectBlockItemId ?? crypto.randomUUID();
          dialogue.projectBlockItemId = blockId;

          const voiceCode = characterVoiceMap[dialogue.roleId] || defaultVoiceCode;
          vbeeBlocks.push({
            id: blockId,
            characters: dialogue.line.length,
            speed: 1,
            voice_code: voiceCode,
            break_time: 1,
            text: dialogue.line,
          });
        }
      });
    });
  });

  const payload: CreateVbeeProjectPayload = {
    title: script.title,
    product: 'TTS',
    isDeleted: false,
    blocks: vbeeBlocks,
  };

  return { payload, updatedScript };
};
