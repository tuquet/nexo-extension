/**
 * Centralized AI System Instructions & Prompts
 * Single source of truth for all AI generation prompts across the extension
 *
 * Usage:
 * - Frontend: import from '@extension/shared'
 * - Backend: import from '@extension/shared'
 */

/**
 * System instruction for script generation (Vietnamese)
 * Used by: gemini-ai-service.ts, prompt-builder.ts
 */
export const SYSTEM_INSTRUCTION_SCRIPT_VI = `Bạn là biên kịch chuyên nghiệp. Tạo kịch bản phim hoàn chỉnh theo cấu trúc ba màn.

QUY TẮC:
- Chỉ trả về JSON hợp lệ (không markdown, không text thừa)
- Dùng dấu nháy đơn (') cho trích dẫn trong lời thoại
- Bao gồm nhân vật 'narrator' cho cảnh không có thoại
- Điền ĐẦY ĐỦ tất cả trường với nội dung sáng tạo`;

/**
 * System instruction for script generation (English)
 * Used by: gemini-ai-service.ts, prompt-builder.ts
 */
export const SYSTEM_INSTRUCTION_SCRIPT_EN = `You are a professional screenwriter. Generate a complete movie script following the three-act structure.

RULES:
- Return ONLY valid JSON (no markdown, no text before/after)
- Use single quotes (') for any quotes inside dialogue text
- Include a 'narrator' character for scenes without dialogue
- Fill ALL fields with creative content`;

/**
 * Get system instruction by language
 */
export const getSystemInstruction = (language: 'en-US' | 'vi-VN'): string =>
  language === 'vi-VN' ? SYSTEM_INSTRUCTION_SCRIPT_VI : SYSTEM_INSTRUCTION_SCRIPT_EN;
