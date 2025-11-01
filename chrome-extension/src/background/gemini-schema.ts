/**
 * This file contains the JSON schema definition for a script.
 * It is used to "prime" the Gemini AI model, helping it understand the desired output structure.
 */
export const GEMINI_SCRIPT_SCHEMA = `{
  "title": "string",
  "alias": "string (kebab-case, for filenames)",
  "logline": "string (1-2 sentence summary)",
  "genre": ["string"],
  "tone": "string (e.g., 'Trầm tư, nội tâm, thanh tịnh')",
  "themes": ["string"],
  "notes": "string (Overall notes about the film's style, music, etc.)",
  "setting": {
    "time": "string (e.g., 'Hiện tại', '1990s')",
    "location": "string (e.g., 'Một ngôi chùa Thiền thanh tịnh trên núi.')",
  },
  "characters": [
    {
      "name": "string",
      "roleId": "string (A unique, non-accented, camelCase identifier for the character's role. This ID links dialogues to this character. E.g., 'protagonist', 'mentor', 'narrator').",
      "description": "string (A brief, human-readable description of the character)"
    }
  ],
  "acts": [
    {
      "act_number": "number",
      "summary": "string (Summary of this act)",
      "scenes": [
        {
          "scene_number": "number",
          "time": "string (e.g., 'Ngày', 'Đêm', 'Hoàng hôn')",
          "location": "string",
          "action": "string (Description of what happens in the scene, what characters do)",
          "visual_style": "string (Description of the visual style)",
          "audio_style": "string (Description of the audio style)",
          "dialogues": [
            {
              "roleId": "string (Must match a 'roleId' from the 'characters' list)",
              "line": "string (The dialogue line)"
            }
          ]
        }
      ]
    }
  ]
}`;
