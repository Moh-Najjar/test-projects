import React, { createContext, useContext, useMemo } from "react";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useTranslation } from "react-i18next";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

import { isRtl } from "../../i18n/languages";

// Public type for direction state
export type Direction = "ltr" | "rtl";

// Expose a React context for current direction
const DirectionContext = createContext<Direction>("ltr");

// Create an Emotion cache that applies RTL plugin when needed
function createEmotionCache(dir: Direction) {
  return createCache({
    key: dir === "rtl" ? "mui-rtl" : "mui",
    stylisPlugins: dir === "rtl" ? [prefixer, rtlPlugin] : [prefixer],
  });
}

export const DirectionProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { i18n } = useTranslation();

  // Derive direction from the active language
  const dir: Direction = useMemo(
    () => (isRtl(i18n.language) ? "rtl" : "ltr"),
    [i18n.language],
  );

  // Create a memoized Emotion cache per direction
  const cache = useMemo(() => createEmotionCache(dir), [dir]);

  return (
    <DirectionContext.Provider value={dir}>
      {/* Provide the Emotion cache so RTL/LTR styles are generated correctly */}
      <CacheProvider value={cache}>
        {/* Ensure native elements reflect current direction for layout */}
        <div dir={dir}>{children}</div>
      </CacheProvider>
    </DirectionContext.Provider>
  );
};

export const useDirection = () => useContext(DirectionContext);
