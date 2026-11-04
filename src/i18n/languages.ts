export const RTL_LANGS = ["ar"] as const;
export type AppLanguage = "en" | "ar";

export const isRtl = (lng?: string): boolean => {
  return !!lng && lng === "ar";
};
