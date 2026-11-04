import { FieldError } from "react-hook-form";
import { FormField } from "../types/FormField";

/** Options bag accepted by the translation function */
type TranslationOptions = Record<string, unknown>;

/**
 * Builds react-hook-form validation rules for a given FormField.
 * Handles: isRequired, and optional regexPattern with localised error messages.
 */
export const getValidationRules = (
  field: FormField,
  loc: (en: string, ar: string) => string,
  t: (key: string, options?: TranslationOptions) => string,
  isGridField?: boolean
): Record<string, unknown> => {
  const rules: Record<string, unknown> = {};

  /** Required rule — applies to all control types */
  if (field.isRequired || (isGridField && field.isRequired)) {
    rules.required = t("validation.required", {
      field: loc(field.labelEn, field.labelAr),
    });
  }

  /**
   * Regex pattern rule — only added when the field carries a regexPattern.
   * Uses RHF's built-in `pattern` key so the check runs automatically on change/blur.
   * The localised message is resolved via `loc`; empty strings fall back to a generic message.
   */
  if (field.regexPattern && !field.isReadOnly) {
    const patternMessage =
      loc(
        field.validationMessageEn ?? "",
        field.validationMessageAr ?? ""
      ) || t("validation.pattern", { field: loc(field.labelEn, field.labelAr) });

    rules.pattern = {
      value: new RegExp(field.regexPattern),
      message: patternMessage,
    };
  }

  return rules;
};

/**
 * Computes the localised error message for a react-hook-form FieldError at
 * render time, using the **current** locale functions.
 *
 * react-hook-form caches `fieldState.error.message` as a static string from
 * the moment validation last ran, so it does not update automatically when
 * the UI language changes.  Instead of reading the cached string we switch on
 * `fieldState.error.type` (which is always stable) and re-derive the message
 * from the live `loc` / `t` helpers that already reflect the new language.
 */
export const getLocalizedErrorMessage = (
  error: FieldError,
  field: FormField,
  loc: (en: string, ar: string) => string,
  t: (key: string, options?: TranslationOptions) => string
): string => {
  switch (error.type) {
    case "required":
      return t("validation.required", {
        field: loc(field.labelEn, field.labelAr),
      });

    case "pattern": {
      const patternMsg = loc(
        field.validationMessageEn ?? "",
        field.validationMessageAr ?? ""
      );
      return (
        patternMsg ||
        t("validation.pattern", { field: loc(field.labelEn, field.labelAr) })
      );
    }

    case "duplicate":
      return t("validation.duplicateRow", {
        field: loc(field.labelEn, field.labelAr),
      });

    default:
      /** For any custom validator key, fall back to the cached message. */
      return error.message ?? "";
  }
};
