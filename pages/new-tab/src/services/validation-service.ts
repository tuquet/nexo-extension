/**
 * Validation Service
 *
 * Purpose: Validate dialogue lines and other content for TTS quality
 * Responsibilities:
 * - Validate dialogue lines (stage directions, empty lines, etc.)
 * - Configurable validation rules
 * - Strip invalid content
 * - Provide detailed error messages
 *
 * Benefits:
 * - Single place for all validation logic
 * - Easy to add new rules (Open/Closed Principle)
 * - Configurable per use case
 * - Easy to test
 */

/**
 * Validation result
 */
interface ValidationResult {
  isValid: boolean;
  warnings: string[];
}

/**
 * Validation rule interface
 * All rules must implement this
 */
interface IValidationRule {
  name: string;
  validate(text: string): string | null; // Returns warning message or null
  fix?(text: string): string; // Optional: auto-fix the issue
}

/**
 * Rule: Detect parentheses (most common stage direction)
 * Example: (shouting), (whispers), (internal monologue)
 */
class ParenthesesRule implements IValidationRule {
  name = 'Parentheses Stage Direction';

  validate(text: string): string | null {
    if (/\([^)]+\)/.test(text)) {
      return 'Lời thoại chứa chú thích trong ngoặc đơn (ảnh hưởng TTS)';
    }
    return null;
  }

  fix(text: string): string {
    return text.replace(/\([^)]+\)/g, '').trim();
  }
}

/**
 * Rule: Detect square brackets
 * Example: [action], [pause], [note]
 */
class SquareBracketsRule implements IValidationRule {
  name = 'Square Brackets Stage Direction';

  validate(text: string): string | null {
    if (/\[[^\]]+\]/.test(text)) {
      return 'Lời thoại chứa chú thích trong ngoặc vuông (ảnh hưởng TTS)';
    }
    return null;
  }

  fix(text: string): string {
    return text.replace(/\[[^\]]+\]/g, '').trim();
  }
}

/**
 * Rule: Detect asterisks (common for actions)
 * Example: *sighs*, *laughs*, *cries*
 */
class AsterisksRule implements IValidationRule {
  name = 'Asterisks Action';

  validate(text: string): string | null {
    if (/\*[^*]+\*/.test(text)) {
      return 'Lời thoại chứa hành động đánh dấu bằng dấu * (ảnh hưởng TTS)';
    }
    return null;
  }

  fix(text: string): string {
    return text.replace(/\*[^*]+\*/g, '').trim();
  }
}

/**
 * Rule: Detect empty or whitespace-only lines
 */
class EmptyLineRule implements IValidationRule {
  name = 'Empty Line';

  validate(text: string): string | null {
    if (!text || text.trim().length === 0) {
      return 'Lời thoại trống hoặc chỉ chứa khoảng trắng';
    }
    return null;
  }

  fix(text: string): string {
    return text.trim();
  }
}

/**
 * Rule: Detect excessive punctuation
 * Example: "Wait!!!!!!", "What?????"
 */
class ExcessivePunctuationRule implements IValidationRule {
  name = 'Excessive Punctuation';
  private threshold: number;

  constructor(threshold = 3) {
    this.threshold = threshold;
  }

  validate(text: string): string | null {
    const pattern = new RegExp(`[!?]{${this.threshold},}`);
    if (pattern.test(text)) {
      return `Dấu chấm than/hỏi lặp lại quá ${this.threshold} lần (ảnh hưởng TTS)`;
    }
    return null;
  }

  fix(text: string): string {
    // Reduce to single punctuation
    return text
      .replace(/!{2,}/g, '!')
      .replace(/\?{2,}/g, '?')
      .trim();
  }
}

/**
 * Validation configuration
 */
interface ValidationConfig {
  enableParenthesesRule?: boolean;
  enableSquareBracketsRule?: boolean;
  enableAsterisksRule?: boolean;
  enableEmptyLineRule?: boolean;
  enableExcessivePunctuationRule?: boolean;
  excessivePunctuationThreshold?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ValidationConfig> = {
  enableParenthesesRule: true,
  enableSquareBracketsRule: true,
  enableAsterisksRule: true,
  enableEmptyLineRule: true,
  enableExcessivePunctuationRule: true,
  excessivePunctuationThreshold: 3,
};

/**
 * Validation Service
 * Configurable dialogue validation with multiple rules
 */
class ValidationService {
  private rules: IValidationRule[] = [];

  constructor(config: ValidationConfig = {}) {
    this.configure(config);
  }

  /**
   * Configure validation rules
   */
  configure(config: ValidationConfig): void {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    this.rules = [];

    if (finalConfig.enableParenthesesRule) {
      this.rules.push(new ParenthesesRule());
    }
    if (finalConfig.enableSquareBracketsRule) {
      this.rules.push(new SquareBracketsRule());
    }
    if (finalConfig.enableAsterisksRule) {
      this.rules.push(new AsterisksRule());
    }
    if (finalConfig.enableEmptyLineRule) {
      this.rules.push(new EmptyLineRule());
    }
    if (finalConfig.enableExcessivePunctuationRule) {
      this.rules.push(new ExcessivePunctuationRule(finalConfig.excessivePunctuationThreshold));
    }
  }

  /**
   * Validate text against all enabled rules
   */
  validate(text: string): ValidationResult {
    const warnings: string[] = [];

    for (const rule of this.rules) {
      const warning = rule.validate(text);
      if (warning) {
        warnings.push(warning);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Auto-fix text by applying all rule fixes
   */
  fix(text: string): string {
    let fixed = text;

    for (const rule of this.rules) {
      if (rule.fix) {
        fixed = rule.fix(fixed);
      }
    }

    // Clean up multiple spaces
    fixed = fixed.replace(/\s+/g, ' ').trim();

    return fixed;
  }

  /**
   * Add custom rule
   */
  addRule(rule: IValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove rule by name
   */
  removeRule(ruleName: string): void {
    this.rules = this.rules.filter(r => r.name !== ruleName);
  }

  /**
   * Get all active rules
   */
  getRules(): IValidationRule[] {
    return [...this.rules];
  }
}

/**
 * Singleton instance with default config
 * Use this throughout the application
 */
const validationService = new ValidationService();

/**
 * Backward compatibility exports
 * Maps old API to new service
 */
const validateDialogueLine = (line: string): ValidationResult => validationService.validate(line);

const stripStageDirections = (line: string): string => validationService.fix(line);

export type { IValidationRule, ValidationConfig, ValidationResult };
export { ValidationService, validationService, validateDialogueLine, stripStageDirections };
