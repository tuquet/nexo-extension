/**
 * Gemini Prompt Templates for Side Panel
 * Template prompts for quick access and automation
 */

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'script-generation' | 'image-generation' | 'video-generation' | 'character-dev' | 'general';
  prompt: string;
  description?: string;
  tags?: string[];
  icon?: string;
}

export const GEMINI_PROMPTS: PromptTemplate[] = [
  // ============= SCRIPT GENERATION =============
  {
    id: 'script-3act-drama',
    title: 'Kịch bản 3 hồi - Drama',
    category: 'script-generation',
    icon: '🎬',
    description: 'Template chuẩn cho kịch bản phim ngắn 3 hồi với conflict tâm lý',
    tags: ['drama', 'script', '3-act', 'structured'],
    prompt: `Hãy viết một kịch bản phim ngắn theo cấu trúc 3 hồi (Three-Act Structure) với các yêu cầu sau:

**THÔNG TIN CƠ BẢN:**
- Thời lượng: 10-15 phút
- Thể loại: Drama, psychological realism
- Setting: Việt Nam hiện đại, môi trường đô thị
- Nhân vật chính: 2-3 người có quan hệ phức tạp
- Tone: Nghiêm túc, cảm động, có chiều sâu tâm lý

**CẤU TRÚC:**

Act 1 - SETUP (25%):
- Giới thiệu nhân vật chính, thế giới, và normal life
- Establish mối quan hệ và dynamics
- Inciting incident: sự kiện kích hoạt câu chuyện
- End with a turning point

Act 2 - CONFRONTATION (50%):
- Nhân vật đối mặt với obstacle chính
- Conflict leo thang, stakes tăng cao
- Character development through challenges
- Midpoint: major plot twist hoặc revelation
- Progressive complications
- All is lost moment / Dark night of the soul

Act 3 - RESOLUTION (25%):
- Climax: đối đầu cuối cùng với conflict
- Nhân vật phải đưa ra quyết định quan trọng
- Resolution: giải quyết các mối quan hệ và plot threads
- Denouement: new normal, character transformation
- Kết thúc với emotional payoff hoặc thought-provoking note

**FORMAT YÊU CẦU:**
- Sử dụng standard screenplay format
- Scene headings: INT./EXT. - LOCATION - TIME OF DAY
- Action lines: Present tense, visual descriptions
- Character names in CAPS before dialogue
- Parentheticals chỉ khi cần thiết
- Transitions: CUT TO, FADE OUT (khi cần)

**THEME & DEPTH:**
- Chọn một theme sâu sắc (family, identity, sacrifice, truth, etc.)
- Subtext trong dialogue, không nói thẳng mọi thứ
- Visual storytelling: show don't tell
- Character arc rõ ràng: transformation từ đầu đến cuối

Hãy tạo một câu chuyện có chiều sâu, cảm động và ý nghĩa.`,
  },
  {
    id: 'script-comedy-short',
    title: 'Kịch bản hài ngắn',
    category: 'script-generation',
    icon: '😄',
    description: 'Template cho phim hài tình huống với setup-punchline structure',
    tags: ['comedy', 'short', 'sitcom'],
    prompt: `Viết một kịch bản phim hài ngắn (5-8 phút) với yêu cầu:

**TONE & STYLE:**
- Thể loại: Situational comedy / Character comedy
- Tone: Light-hearted, fun, không quá slapstick
- Humor style: Wordplay, irony, absurdity, character quirks

**STRUCTURE:**
- Setup: Establish tình huống bình thường và nhân vật
- Complication: Sự kiện gây ra misunderstanding hoặc chaos
- Escalation: Tình huống càng lúc càng tệ theo cách buồn cười
- Resolution: Giải quyết theo cách bất ngờ và hài hước
- Tag: Punchline cuối cùng

**COMEDY ELEMENTS:**
- Rule of three trong jokes
- Callbacks: nhắc lại setup từ đầu phim
- Visual gags và physical comedy (nếu phù hợp)
- Timing: setup và punchline rõ ràng
- Character reactions: overreactions hoặc underreactions

**DIALOGUE:**
- Natural, conversational
- Wordplay và double entendres
- Banter và back-and-forth
- Running gags

Setting: Việt Nam đương đại, tình huống relatable. Tạo nhân vật memorable với personality rõ ràng.`,
  },
  {
    id: 'script-horror-suspense',
    title: 'Kịch bản kinh dị tâm lý',
    category: 'script-generation',
    icon: '👻',
    description: 'Template cho phim kinh dị tâm lý với tension building',
    tags: ['horror', 'psychological', 'suspense'],
    prompt: `Tạo kịch bản phim kinh dị tâm lý (psychological horror/thriller) 12-15 phút:

**ATMOSPHERE:**
- Tập trung vào dread và unease hơn là jump scares
- Slow burn: tension build-up dần dần
- Ambiguity: blur line giữa real và imagined
- Isolation: character cảm thấy trapped hoặc alone

**STRUCTURE:**
- Act 1: Normal life, hint of something off
- Act 2: Reality breakdown, paranoia escalates, gaslighting elements
- Act 3: Truth revealed (hoặc still ambiguous), climax horrifying

**HORROR ELEMENTS:**
- Psychological manipulation
- Unreliable narrator potential
- Foreshadowing và red herrings
- Symbolism và metaphor
- Sound design cues: silence, ambient sounds, sudden noises

**PACING:**
- Slow reveals, không rush
- Quiet moments → tension → release (không phải scare)
- Save biggest scare/revelation cho climax

**VISUAL STYLE:**
- Shadows, dim lighting descriptions
- Claustrophobic spaces
- Mirror shots, reflections
- POV shots cho subjective experience

Tạo một câu chuyện unsettling, stick with người xem sau khi kết thúc. Setting: Việt Nam, có thể incorporate văn hóa local.`,
  },

  // ============= IMAGE GENERATION =============
  {
    id: 'image-cinematic-scene',
    title: 'Cinematic Scene Description',
    category: 'image-generation',
    icon: '📸',
    description: 'Chuyển đổi scene description thành detailed image prompt',
    tags: ['cinematic', 'imagen', 'visual', 'photography'],
    prompt: `Tôi sẽ cung cấp một scene description từ kịch bản. Hãy chuyển đổi nó thành một detailed image generation prompt cho Imagen/DALL-E với format sau:

**INPUT SCENE:**
[USER SẼ PASTE SCENE DESCRIPTION Ở ĐÂY]

**OUTPUT FORMAT:**

1. **Subject & Action:**
   - Mô tả chi tiết nhân vật, hành động, emotion
   - Age, gender, appearance, clothing, expression

2. **Camera & Composition:**
   - Shot type: Wide shot / Medium shot / Close-up / Extreme close-up / Over-the-shoulder / POV / Bird's eye / Low angle / High angle
   - Rule of thirds, leading lines, framing
   - Depth of field: shallow / deep focus

3. **Lighting:**
   - Light source: Natural / Artificial / Mixed
   - Quality: Soft / Hard / Diffused / Direct
   - Direction: Front / Back / Side / Top / Rim lighting
   - Time of day: Golden hour / Blue hour / Midday / Night
   - Mood: Dramatic / Natural / Moody / High-key / Low-key

4. **Color & Mood:**
   - Color palette: Warm / Cool / Monochrome / Vibrant / Muted
   - Color grading reference: Cinematic teal-orange / Desaturated / Film noir
   - Atmosphere: Dreamy / Gritty / Ethereal / Realistic

5. **Style Reference:**
   - Cinematographer style (e.g., Roger Deakins, Emmanuel Lubezki)
   - Film reference (e.g., Blade Runner 2049, Her, Moonlight)
   - Art movement (e.g., Film noir, Neo-realism)

6. **Technical Specs:**
   - Aspect ratio: 16:9 / 2.39:1 / 4:3 / 1:1
   - Camera: 35mm / 50mm / 85mm lens
   - Look: Cinematic / Documentary / Vintage film grain

**FINAL PROMPT (in English):**
[Consolidated 2-3 paragraph prompt optimized for image generation]

Hãy analyze scene và output detailed, technical prompt.`,
  },
  {
    id: 'image-character-portrait',
    title: 'Character Portrait Design',
    category: 'image-generation',
    icon: '🎭',
    description: 'Tạo portrait chi tiết cho nhân vật từ character description',
    tags: ['character', 'portrait', 'design'],
    prompt: `Từ character description, hãy tạo detailed image prompt cho character portrait:

**INPUT:**
[CHARACTER DESCRIPTION: name, age, personality, background, role in story]

**OUTPUT PROMPT FORMAT:**

1. **Physical Appearance:**
   - Age, ethnicity, gender
   - Face: shape, features, skin tone, distinctive marks
   - Hair: style, color, texture
   - Eyes: color, expression, emotional quality
   - Body type, posture, physicality

2. **Clothing & Style:**
   - Wardrobe reflecting personality and era
   - Colors and textures
   - Accessories, jewelry, props
   - Level of formality or casualness

3. **Expression & Emotion:**
   - Facial expression capturing personality
   - Body language and posture
   - Emotional quality: confident, vulnerable, mysterious, etc.

4. **Lighting & Photography Style:**
   - Portrait lighting: Rembrandt / Butterfly / Split / Loop
   - Background: Simple / Environmental / Studio
   - Focus: Sharp on eyes, shallow depth of field

5. **Artistic Style:**
   - Photorealistic portrait / Painterly / Illustration style
   - Reference: Cinematic headshot / Fashion photography / Fine art portrait

6. **Mood & Atmosphere:**
   - Overall feeling: Intimate / Powerful / Melancholic / Mysterious
   - Color mood: Warm / Cool / Dramatic contrast

**ENGLISH PROMPT:**
[2-paragraph optimized prompt for Imagen/Midjourney]

Make it distinctive, memorable, và capture essence của character.`,
  },

  // ============= VIDEO GENERATION =============
  {
    id: 'video-scene-blocking',
    title: 'Scene Blocking & Camera Movement',
    category: 'video-generation',
    icon: '🎥',
    description: 'Mô tả chi tiết blocking và camera cho video generation',
    tags: ['video', 'veo', 'blocking', 'camera'],
    prompt: `Tạo detailed video prompt cho Veo với scene description sau:

**INPUT SCENE:**
[PASTE SCENE SCRIPT HERE]

**OUTPUT - VIDEO GENERATION PROMPT:**

1. **Scene Setup:**
   - Location description (INT/EXT, specific environment)
   - Time of day, weather, ambient conditions
   - Overall mood and atmosphere

2. **Character Blocking:**
   - Starting positions of characters
   - Movement patterns (entrances, exits, blocking)
   - Interaction choreography
   - Emotional beats and transitions

3. **Camera Movement:**
   - Starting shot type and angle
   - Camera movement: Static / Pan / Tilt / Dolly / Track / Crane / Handheld / Steadicam
   - Movement motivation (following action, revealing space, emotional emphasis)
   - Speed and smoothness of movement

4. **Action Sequence:**
   - Timeline of events (0-5s, 5-10s, etc.)
   - Key moments and beats
   - Timing of dialogue or sound cues
   - Transitions between shots/angles

5. **Cinematography:**
   - Lighting changes during scene
   - Focus shifts (rack focus moments)
   - Lens characteristics (wide/normal/telephoto feel)

6. **Duration & Pacing:**
   - Total clip length (typically 5-10 seconds for Veo)
   - Pacing: slow/contemplative vs fast/dynamic
   - Rhythm matching emotional tone

**FINAL VEO PROMPT (English):**
[Concise but detailed prompt with temporal structure]

Example format: "Start with medium shot of [character] at [location]. Camera slowly dollies forward as [action]. At 5 seconds, character turns and [action], camera follows with smooth pan. Lighting is [description]. Ends with close-up of [emotion/object]. Cinematic, [mood], [style reference]."`,
  },

  // ============= CHARACTER DEVELOPMENT =============
  {
    id: 'character-backstory',
    title: 'Character Backstory Generator',
    category: 'character-dev',
    icon: '📖',
    description: 'Tạo detailed backstory và character profile',
    tags: ['character', 'development', 'backstory'],
    prompt: `Hãy tạo một character profile đầy đủ và sâu sắc cho nhân vật trong phim:

**CHARACTER BASICS:**
- Tên, tuổi, nghề nghiệp
- Vai trò trong story: Protagonist / Antagonist / Supporting

**BACKSTORY:**
1. **Origin:** Quê quán, gia đình, childhood significant events
2. **Formative Experiences:** Events shaped personality và worldview
3. **Wounds & Trauma:** Past hurts influencing current behavior
4. **Relationships:** Key people trong past và current life
5. **Turning Points:** Decisions changed life trajectory

**PERSONALITY:**
- Myers-Briggs hoặc Enneagram type (for consistency)
- Core traits: 3 positive, 3 negative
- Values & beliefs
- Fears & insecurities
- Desires & goals
- Contradictions & complexities

**EXTERNAL TRAITS:**
- Physical appearance reflecting inner life
- Mannerisms, habits, quirks
- Speech patterns, vocabulary
- Style & aesthetics choices

**CHARACTER ARC:**
- Starting point: Who they are at beginning
- Want vs Need: What they think they want vs what they actually need
- Internal conflict
- Transformation potential
- Ending point: Who they could become

**RELATIONSHIPS & DYNAMICS:**
- How they relate to other characters
- Relationship patterns and attachment style
- How they're perceived by others vs how they see themselves

Tạo character cảm thấy real, three-dimensional, với internal consistency nhưng cũng có contradictions như người thật.`,
  },

  // ============= GENERAL UTILITIES =============
  {
    id: 'general-rewrite-professional',
    title: 'Viết lại chuyên nghiệp',
    category: 'general',
    icon: '✍️',
    description: 'Cải thiện text với tone chuyên nghiệp, rõ ràng',
    tags: ['rewrite', 'professional', 'editing'],
    prompt: `Hãy viết lại đoạn text sau với các cải thiện:

**INPUT TEXT:**
[PASTE TEXT HERE]

**REQUIREMENTS:**
1. Giữ nguyên ý nghĩa core
2. Cải thiện clarity và coherence
3. Loại bỏ redundancy và wordiness
4. Strengthen verb choices
5. Improve flow và rhythm
6. Fix grammar và punctuation issues
7. Make more engaging và professional

**TONE:** [Professional / Conversational / Academic / Creative]

**OUTPUT:**
- Bản rewrite
- Brief explanation của main changes
- Alternative phrasings cho key sentences (if any)`,
  },
  {
    id: 'general-brainstorm-ideas',
    title: 'Brainstorm Creative Ideas',
    category: 'general',
    icon: '💡',
    description: 'Generate multiple creative directions cho concept',
    tags: ['brainstorm', 'ideation', 'creative'],
    prompt: `Hãy brainstorm creative ideas cho concept sau:

**CONCEPT/THEME:**
[DESCRIBE CONCEPT HERE]

**CONTEXT:**
- Medium: [Film / Video / Script / etc.]
- Target audience:
- Constraints:
- Goals:

**BRAINSTORM OUTPUT:**

Generate 10-15 diverse ideas, mỗi idea gồm:
1. **Title/Tagline:** Catchy, memorable
2. **Core Concept:** 1-2 sentences
3. **Unique Angle:** What makes it different
4. **Potential Challenges:** Things to consider
5. **Emotional Hook:** Why audience care

**EVALUATION CRITERIA:**
- Originality: 1-5
- Feasibility: 1-5
- Impact potential: 1-5

Sau đó recommend top 3 ideas với detailed reasoning.`,
  },
  {
    id: 'general-feedback-analysis',
    title: 'Phân tích Feedback & Revision',
    category: 'general',
    icon: '📝',
    description: 'Analyze feedback và đề xuất revisions',
    tags: ['feedback', 'revision', 'editing'],
    prompt: `Tôi có một piece of work và feedback. Hãy phân tích và đề xuất revisions:

**ORIGINAL WORK:**
[PASTE WORK HERE]

**FEEDBACK RECEIVED:**
[PASTE FEEDBACK HERE]

**ANALYSIS:**

1. **Feedback Categorization:**
   - Structural issues
   - Content/creative issues
   - Technical issues
   - Style/tone issues

2. **Priority Ranking:**
   - Critical: Must fix
   - Important: Should fix
   - Optional: Consider fixing

3. **Conflicting Feedback Resolution:**
   - Identify contradictions
   - Suggest balanced approach

4. **Revision Plan:**
   - Step-by-step action items
   - Estimated impact of each change
   - What to keep unchanged and why

5. **Revised Version:**
   - Show revised work incorporating feedback
   - Highlight major changes
   - Explain rationale for decisions

Provide constructive, actionable guidance.`,
  },
];

/**
 * Get prompts by category
 */
export const getPromptsByCategory = (category: PromptTemplate['category']): PromptTemplate[] =>
  GEMINI_PROMPTS.filter(p => p.category === category);

/**
 * Search prompts by title, description, or tags
 */
export const searchPrompts = (query: string): PromptTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return GEMINI_PROMPTS.filter(
    p =>
      p.title.toLowerCase().includes(lowercaseQuery) ||
      p.description?.toLowerCase().includes(lowercaseQuery) ||
      p.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)),
  );
};

/**
 * Get prompt by ID
 */
export const getPromptById = (id: string): PromptTemplate | undefined => GEMINI_PROMPTS.find(p => p.id === id);
