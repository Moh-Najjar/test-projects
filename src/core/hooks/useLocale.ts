import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { isRtl } from "../../i18n/languages";

export interface UseLocaleReturn {
  /** true when the active language is Arabic (RTL) */
  isAr: boolean;
  /** react-i18next t() for keyed translations */
  t: ReturnType<typeof useTranslation>["t"];
  /**
   * Returns the Arabic value when the active language is Arabic,
   * otherwise returns the English value. Falls back to the other
   * language when the preferred value is empty.
   * Use this for bilingual API fields (nameEn/nameAr, labelEn/labelAr).
   */
  loc: (enVal: string | null | undefined, arVal: string | null | undefined) => string;
}

/** Thin wrapper around useTranslation that adds the loc() bilingual helper */
export const useLocale = (): UseLocaleReturn => {
  const { t, i18n } = useTranslation();
  const isAr = isRtl(i18n.language);

  const loc = useCallback(
    (enVal: string | null | undefined, arVal: string | null | undefined): string => {
      const english = enVal ?? '';
      const arabic = arVal ?? '';
      const preferred = isAr ? arabic : english;
      const fallback = isAr ? english : arabic;
      return preferred.trim().length > 0 ? preferred : fallback;
    },
    [isAr],
  );

  return { isAr, t, loc };
};
