/**
 * Seed Prompt Template for CineGenie Database
 *
 * This file contains a single, comprehensive prompt template that demonstrates
 * ALL available options for the handleGenerateScript API. It serves as:
 * - A complete reference implementation
 * - A testing template for automation features
 * - Documentation of the full API surface
 *
 * Usage:
 * import { SEED_PROMPT } from './seed-prompts';
 * await db.prompts.add(SEED_PROMPT);
 */

import type { PromptRecord } from './db';

/**
 * Single comprehensive seed prompt with ALL handleGenerateScript options
 */
export const SEED_PROMPT: Omit<PromptRecord, 'id' | 'createdAt' | 'updatedAt'> = {
  // ============================================================================
  // Basic Identification
  // ============================================================================
  title: 'Trình tạo kịch bản mẫu (tiêu chuẩn)',
  category: 'script-generation',

  // ============================================================================
  // Prompt Template with Variable Support
  // ============================================================================
  prompt: `Hãy tạo một kịch bản phim thể loại {{genre}} về {{premise}}.

**Bối cảnh & Thời gian:**
- Địa điểm: {{location}}
- Thời kỳ: {{time_period}}
- Thời lượng: {{duration}} phút

**Yêu cầu về câu chuyện:**
- Tông: {{tone}}
- Phong cách: {{style}}
- Chủ đề chính: {{theme}}
- Đối tượng khán giả: {{audience}}

**Hướng dẫn về nhân vật:**
- Số lượng nhân vật chính: {{character_count}}
- Mối quan hệ giữa các nhân vật: {{character_dynamics}}

**Cấu trúc:**
Tuân theo cấu trúc ba hồi:
- Hồi 1: Giới thiệu và sự kiện khởi đầu
- Hồi 2: Cao trào với các tình huống phức tạp
- Hồi 3: Đỉnh điểm và kết thúc

**Phong cách hình ảnh & âm thanh:**
- Quay phim: {{visual_style}}
- Âm nhạc/Hướng dẫn âm thanh: {{audio_style}}

**Chỉ dẫn đặc biệt:**
{{special_instructions}}

**Ngôn ngữ đầu ra:** {{language}}`,

  // ============================================================================
  // Metadata & Organization
  // ============================================================================
  description:
    'Mẫu tham khảo đầy đủ minh họa tất cả tham số của API handleGenerateScript. Bao gồm thay thế biến, hướng dẫn hệ thống tùy chỉnh, thiết lập mô hình nâng cao (temperature, topP, topK, maxOutputTokens), cấu hình tiền/xử lý đầu ra, và theo dõi metadata hoàn chỉnh.',

  tags: ['demo-hoan-chinh', 'day-du-tinh-nang', 'tao-kich-ban', 'bien', 'tuy-chinh', 'nang-cao', 'mau-tham-khao'],

  icon: '🎬',

  // ============================================================================
  // System Instruction Override
  // ============================================================================
  systemInstruction: `Bạn là một biên kịch chuyên nghiệp từng đoạt giải, có chuyên môn sâu rộng về mọi thể loại và định dạng. Nhiệm vụ của bạn là tạo ra một kịch bản phim hoàn chỉnh, sẵn sàng sản xuất dựa trên các yêu cầu chi tiết của người dùng.

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
- Nhịp độ phù hợp với thời lượng yêu cầu`,

  // ============================================================================
  // Output Configuration
  // ============================================================================
  outputFormat: 'json-structured',
  customSchema: undefined, // Sử dụng SCRIPT_GENERATION_SCHEMA mặc định từ background/schemas/script-schema.ts

  // ============================================================================
  // Model Settings (ALL handleGenerateScript parameters)
  // ============================================================================
  modelSettings: {
    preferredModel: 'gemini-2.5-flash', // Tuỳ chọn: gemini-2.5-flash, gemini-2.5-pro, gemini-exp-1206
    temperature: 1.2, // 0.0-2.0: Điều chỉnh độ sáng tạo (cao = sáng tạo hơn)
    topP: 0.95, // 0.0-1.0: Ngưỡng lấy mẫu nucleus
    topK: 50, // Số nguyên: Giới hạn lựa chọn token trong top K
    maxOutputTokens: 8192, // Số token tối đa trong phản hồi (4096-8192 điển hình)
  },

  // ============================================================================
  // Preprocessing Configuration
  // ============================================================================
  preprocessing: {
    enableVariables: true, // Bật thay thế {{variable}}

    // Định nghĩa biến (mảng JSON các cấu hình biến)
    variableDefinitions: JSON.stringify([
      {
        name: 'genre',
        type: 'select',
        label: 'Thể loại',
        options: [
          'hành động kịch tính',
          'hài lãng mạn',
          'kinh dị tâm lý',
          'khoa học viễn tưởng',
          'hình sự noir',
          'phiêu lưu kỳ ảo',
          'chính kịch lịch sử',
          'trinh thám ly kỳ',
        ],
        default: 'hành động kịch tính',
        required: true,
      },
      {
        name: 'premise',
        type: 'text',
        label: 'Ý tưởng chính',
        placeholder: 'Mô tả ngắn gọn cốt truyện chính',
        default: 'một điệp viên đã nghỉ hưu phải thực hiện nhiệm vụ cuối cùng để cứu con gái xa cách',
        required: true,
      },
      {
        name: 'location',
        type: 'text',
        label: 'Địa điểm chính',
        placeholder: 'Bối cảnh chính của câu chuyện',
        default: 'Đông Âu (Praha, Budapest)',
        required: false,
      },
      {
        name: 'time_period',
        type: 'select',
        label: 'Thời kỳ',
        options: [
          'hiện đại',
          'thập niên 1980',
          'thập niên 1990',
          'tương lai gần (2030s)',
          'lịch sử (ghi rõ trong prompt)',
        ],
        default: 'hiện đại',
        required: false,
      },
      {
        name: 'duration',
        type: 'select',
        label: 'Thời lượng kịch bản',
        options: ['90', '100', '110', '120', '130'],
        default: '110',
        required: false,
      },
      {
        name: 'tone',
        type: 'select',
        label: 'Tông chủ đạo',
        options: [
          'gai góc, thực tế',
          'nhẹ nhàng, hài hước',
          'u ám, căng thẳng',
          'truyền cảm hứng',
          'hồi hộp',
          'man mác buồn',
          'hoành tráng',
        ],
        default: 'gai góc, thực tế',
        required: false,
      },
      {
        name: 'style',
        type: 'text',
        label: 'Phong cách',
        placeholder: 'Tham khảo phim/đạo diễn (vd: "Christopher Nolan", "phong cách Tarantino")',
        default: 'John Wick kết hợp James Bond',
        required: false,
      },
      {
        name: 'theme',
        type: 'text',
        label: 'Chủ đề chính',
        placeholder: 'Chủ đề trung tâm',
        default: 'chuộc lỗi và cơ hội thứ hai',
        required: false,
      },
      {
        name: 'audience',
        type: 'select',
        label: 'Đối tượng khán giả',
        options: ['đại chúng (PG-13)', 'trưởng thành (R)', 'gia đình (PG)', 'người lớn (18+)'],
        default: 'đại chúng (PG-13)',
        required: false,
      },
      {
        name: 'character_count',
        type: 'select',
        label: 'Số nhân vật chính',
        options: ['2', '3', '4', '5', '6'],
        default: '3',
        required: false,
      },
      {
        name: 'character_dynamics',
        type: 'text',
        label: 'Mối quan hệ nhân vật',
        placeholder: 'Cách các nhân vật liên kết (vd: "đối tác bất đắc dĩ", "tam giác tình yêu")',
        default: 'mối quan hệ thầy trò',
        required: false,
      },
      {
        name: 'visual_style',
        type: 'text',
        label: 'Phong cách hình ảnh',
        placeholder: 'Hướng dẫn quay phim (vd: "ánh sáng noir", "cầm tay thực tế")',
        default: 'điện ảnh với các pha hành động thực, hạn chế CGI',
        required: false,
      },
      {
        name: 'audio_style',
        type: 'text',
        label: 'Phong cách âm thanh/nhạc',
        placeholder: 'Hướng dẫn nhạc nền và thiết kế âm thanh',
        default: 'nhạc điện tử dồn dập kết hợp dàn nhạc',
        required: false,
      },
      {
        name: 'special_instructions',
        type: 'text',
        label: 'Chỉ dẫn đặc biệt',
        placeholder: 'Yêu cầu hoặc ràng buộc bổ sung',
        default: 'Có ít nhất một cú twist lớn ở Hồi 2',
        required: false,
      },
      {
        name: 'language',
        type: 'select',
        label: 'Ngôn ngữ kịch bản',
        options: ['en-US', 'vi-VN'],
        default: 'vi-VN',
        required: true,
      },
    ]),

    injectContext: false, // Không tự động chèn context bổ sung
  },

  // ============================================================================
  // Postprocessing Configuration
  // ============================================================================
  postprocessing: {
    steps: ['trim', 'parse-json'], // Xử lý: cắt trắng, parse JSON
    extractField: undefined, // Không trích xuất trường riêng (dùng toàn bộ phản hồi)
  },

  // ============================================================================
  // Metadata for Analytics & Tracking
  // ============================================================================
  metadata: {
    author: 'Nhóm CineGenie',
    version: '3.0.0',
    usageCount: 0, // Tăng mỗi lần sử dụng
    lastUsedAt: undefined, // Cập nhật mỗi lần dùng
    rating: undefined, // 1-5 sao (người dùng đánh giá)
    isFavorite: true, // Đánh dấu truy cập nhanh
  },
};
