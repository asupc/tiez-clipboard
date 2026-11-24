// TieZ ships for Windows only. Keep these helpers so existing call sites stay
// readable, but the platform is fixed.
export const isMacPlatform = (): boolean => false;

export const isWindowsPlatform = (): boolean => true;

export const getNotePlaceholder = (t: (key: string) => string): string =>
  t("note_placeholder_win");
