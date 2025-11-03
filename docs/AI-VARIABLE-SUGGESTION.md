# AI Variable Suggestion Feature

## ✨ Tính năng mới: AI Suggest cho Template Variables

### Cách hoạt động:

1. **AI Suggest Button** - Tự động generate giá trị cho tất cả variables
   - Phân tích prompt template để hiểu context
   - Đọc variable definitions (type, options, placeholder, label)
   - Gọi AI với instruction để sinh giá trị phù hợp
   - Validate kết quả (đặc biệt là select options)
   - Fill tự động vào form

2. **Reset Button** - Khôi phục về default values
   - Nhanh chóng reset về giá trị mặc định
   - Hữu ích khi muốn bắt đầu lại

### UI Updates:

```tsx
📝 Template Variables                [Reset] [✨ AI Suggest]
┌─────────────────────────────────────────────────────────┐
│ Thể loại Video: [Hỏi Thầy 1 Câu         ▼]            │
│ Chủ đề: [_________________________________]             │
│ Bối cảnh: [_______________________________]             │
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
```

### Ví dụ với prompt "1 Phút Mentor":

**Before (thủ công):**
- User phải tự nhập 14 variables
- Mất thời gian suy nghĩ
- Có thể bỏ sót hoặc không nhất quán

**After (AI Suggest):**
```json
{
  "genre": "Đối Thoại Giác Ngộ",
  "premise": "Làm sao để vượt qua cảm giác cô đơn khi sống xa nhà",
  "location": "Góc quay tĩnh tại, Ánh sáng ấm áp (indoor studio)",
  "time_period": "Hiện đại, gần gũi",
  "duration": "60",
  "tone": "Nhẹ nhàng, chữa lành",
  "style": "Giọng điệu ấm áp, chậm rãi, nhấn nhá vào từ khóa",
  "theme": "Kết nối nội tâm, Tìm bình an trong cô đơn",
  "audience": "Người trẻ (Gen Z)",
  "character_count": "2 (Mentor & Người hỏi)",
  "character_dynamics": "Mối quan hệ Thầy trò (Mentor trả lời câu hỏi của Mentee)",
  "visual_style": "Hình ảnh chất lượng cao, màu sắc dịu nhẹ, tập trung vào biểu cảm của Mentor",
  "audio_style": "Nhạc nền Thiền định/Lo-fi nhẹ nhàng, Âm thanh rõ ràng, không tạp âm",
  "special_instructions": "Kết thúc bằng một bài tập thực hành đơn giản",
  "language": "vi-VN"
}
```

### Code Flow:

```
User clicks "AI Suggest"
    ↓
Build context prompt với:
  - Template prompt
  - Variable definitions (name, type, options, placeholder, label)
    ↓
Call ENHANCE_TEXT API với instruction:
  "Generate creative values for these variables. Return ONLY JSON."
    ↓
Parse JSON response (remove markdown, extract object)
    ↓
Validate each value:
  - Select types: Must be in options array
  - Text/Textarea: Accept any string
  - Number: Convert to string
    ↓
Apply validated values to form
    ↓
Show toast: "Applied X AI suggestions"
```

### Benefits:

✅ **Tốc độ**: Tạo biến thể mới trong < 5 giây  
✅ **Sáng tạo**: AI suggest đa dạng, không lặp lại  
✅ **Context-aware**: Hiểu prompt template và variable definitions  
✅ **Validated**: Đảm bảo select options hợp lệ  
✅ **Editable**: User có thể chỉnh sửa sau khi AI fill  
✅ **Regenerate**: Click lại để có suggestions khác  

### Technical Details:

**API Used:** `ENHANCE_TEXT` (existing)
- Temperature: 1.2 (high creativity)
- Instruction: Return only JSON format
- Input: Context about template + variable definitions

**Error Handling:**
- JSON parse errors → Show error toast, keep current values
- API failures → Show error message with retry suggestion
- Invalid select values → Skip invalid, apply valid ones

**Performance:**
- Response time: ~2-5 seconds (depends on API)
- Non-blocking: UI remains responsive during generation
- Loading state: Button shows "Generating..." + disabled

### Usage Example:

1. User selects "Trình tạo kịch bản hoàn chỉnh" template
2. Sees 14+ empty variables
3. Clicks **"✨ AI Suggest"**
4. Wait 3 seconds
5. All fields auto-filled with contextually relevant values
6. Edit any field manually if needed
7. Or click "Reset" to start fresh
8. Or click "AI Suggest" again for different suggestions

---

**Implementation Files:**
- `variable-inputs.tsx` - Main component with AI logic
- `ai-generation-tab.tsx` - Parent component passing promptTemplate
