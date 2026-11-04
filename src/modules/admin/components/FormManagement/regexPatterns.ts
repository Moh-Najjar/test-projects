/**
 * Ready-made regex presets for admin field validation.
 * Labels and descriptions are i18n keys; the stored JSON value is still
 * `regexPattern` (the actual regex string).
 */

export interface RegexPatternPreset {
  id: string;
  labelKey: string;
  descriptionKey: string;
  pattern: string;
  validationMessageEn: string;
  validationMessageAr: string;
}

/** Empty select value — no regex is sent to the API. */
export const NONE_REGEX_PATTERN_VALUE = '';

export const REGEX_PATTERN_PRESETS: RegexPatternPreset[] = [
  {
    id: 'numbers-only',
    labelKey: 'admin.forms.regex.numbersOnly',
    descriptionKey: 'admin.forms.regex.numbersOnlyDesc',
    pattern: '^\\d+$',
    validationMessageEn: 'Only non-negative integer values are allowed',
    validationMessageAr: 'يسمح فقط بالأرقام الصحيحة غير السالبة',
  },
  {
    id: 'numbers-0-100',
    labelKey: 'admin.forms.regex.numbers0100',
    descriptionKey: 'admin.forms.regex.numbers0100Desc',
    pattern: '^(100(\\.0+)?|[0-9]{1,2}(\\.\\d+)?)$',
    validationMessageEn: 'Enter a number between 0 and 100',
    validationMessageAr: 'أدخل رقماً بين 0 و 100',
  },
  {
    id: 'whole-0-100',
    labelKey: 'admin.forms.regex.whole0100',
    descriptionKey: 'admin.forms.regex.whole0100Desc',
    pattern: '^(100|[0-9]{1,2})$',
    validationMessageEn: 'Enter a whole number between 0 and 100',
    validationMessageAr: 'أدخل رقماً صحيحاً بين 0 و 100',
  },
  {
    id: 'decimal-2',
    labelKey: 'admin.forms.regex.decimal2',
    descriptionKey: 'admin.forms.regex.decimal2Desc',
    pattern: '^\\d+(\\.\\d{1,2})?$',
    validationMessageEn: 'Only non-negative decimal values are allowed (up to 2 decimal places)',
    validationMessageAr: 'يسمح فقط بالأرقام العشرية غير السالبة (حتى منزلتين عشريتين)',
  },
  {
    id: 'positive-decimal',
    labelKey: 'admin.forms.regex.positiveDecimal',
    descriptionKey: 'admin.forms.regex.positiveDecimalDesc',
    pattern: '^\\d+(\\.\\d+)?$',
    validationMessageEn: 'Only non-negative numbers are allowed',
    validationMessageAr: 'يسمح فقط بالأرقام غير السالبة',
  },
  {
    id: 'letters-en',
    labelKey: 'admin.forms.regex.lettersEn',
    descriptionKey: 'admin.forms.regex.lettersEnDesc',
    pattern: '^[A-Za-z\\s]+$',
    validationMessageEn: 'Only English letters are allowed',
    validationMessageAr: 'يسمح فقط بالحروف الإنجليزية',
  },
  {
    id: 'letters-ar',
    labelKey: 'admin.forms.regex.lettersAr',
    descriptionKey: 'admin.forms.regex.lettersArDesc',
    pattern: '^[\\u0600-\\u06FF\\s]+$',
    validationMessageEn: 'Only Arabic letters are allowed',
    validationMessageAr: 'يسمح فقط بالحروف العربية',
  },
  {
    id: 'alphanumeric',
    labelKey: 'admin.forms.regex.alphanumeric',
    descriptionKey: 'admin.forms.regex.alphanumericDesc',
    pattern: '^[A-Za-z0-9]+$',
    validationMessageEn: 'Only letters and numbers are allowed',
    validationMessageAr: 'يسمح فقط بالحروف والأرقام',
  },
  {
    id: 'email',
    labelKey: 'admin.forms.regex.email',
    descriptionKey: 'admin.forms.regex.emailDesc',
    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    validationMessageEn: 'Enter a valid email address',
    validationMessageAr: 'أدخل بريداً إلكترونياً صالحاً',
  },
  {
    id: 'jordan-mobile',
    labelKey: 'admin.forms.regex.jordanMobile',
    descriptionKey: 'admin.forms.regex.jordanMobileDesc',
    pattern: '^07[789]\\d{7}$',
    validationMessageEn: 'Enter a valid Jordanian mobile number (e.g. 0791234567)',
    validationMessageAr: 'أدخل رقم هاتف أردني صالح (مثال: 0791234567)',
  },
];

export const findRegexPreset = (pattern: string): RegexPatternPreset | undefined =>
  REGEX_PATTERN_PRESETS.find((preset) => preset.pattern === pattern);

/** True when a stored regex is not one of the named presets (legacy / custom). */
export const isCustomRegexPattern = (pattern: string): boolean =>
  pattern.trim().length > 0 && findRegexPreset(pattern) === undefined;
