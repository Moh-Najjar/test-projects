/*
  Detect the saved theme preference BEFORE the stylesheet is parsed so the
  splash background never flickers.  Mirrors the logic in ThemeContext.tsx:
    1. localStorage  →  2. OS prefers-color-scheme  →  3. default (light)

  Kept as an external file (not inline in index.html) so the
  Content-Security-Policy in web.config can use script-src 'self' without
  'unsafe-inline'.
*/
(function () {
  var storedTheme;
  var storedLang;
  try {
    storedTheme = localStorage.getItem('theme-mode');
    // Same key i18next-browser-languagedetector writes.
    storedLang = localStorage.getItem('i18nextLng');
  } catch (_) { /* ignore */ }

  var prefersDark =
    !storedTheme &&
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (storedTheme === 'dark' || prefersDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Match i18n: Arabic unless a saved choice is English, so the splash
  // copy and direction are correct on the first paint.
  var useEnglish = typeof storedLang === 'string' && storedLang.indexOf('en') === 0;
  document.documentElement.lang = useEnglish ? 'en' : 'ar';
  document.documentElement.dir = useEnglish ? 'ltr' : 'rtl';
})();
